import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { injectable } from 'tsyringe'
import type { SignOptions, SignedToken, SigningKey, SigningKeyName } from '../contracts/index.js'
import {
    SIGNING_ALGORITHM,
    SIGNING_KEYS,
    SIGNING_KEY_LABELS,
    SIGNING_MAX_TTL_SECONDS,
} from '../contracts/index.js'
import { SIGNING_ISSUER, SIGNING_KEYS_DIR, SIGNING_TTL_SECONDS } from '../env.js'
import { NotFoundError, UnavailableError } from '../domain/errors.js'
import { generateKeyPair, signJwt } from '../domain/jwt.js'
import { getLogger } from '../logging.js'

const log = getLogger('signing')

const ACTIVE_FILE = 'active'

export const isSigningKeyName = (value: string): value is SigningKeyName =>
    (SIGNING_KEYS as readonly string[]).includes(value)

@injectable()
export class SigningKeyService {
    private root = path.resolve(SIGNING_KEYS_DIR)

    private dirFor(name: SigningKeyName): string {
        return path.join(this.root, name)
    }

    private async readActiveKid(name: SigningKeyName): Promise<string> {
        const raw = await fs.readFile(path.join(this.dirFor(name), ACTIVE_FILE), 'utf8')
        return raw.trim()
    }

    private async create(name: SigningKeyName): Promise<string> {
        const directory = this.dirFor(name)
        await fs.mkdir(directory, { recursive: true, mode: 0o700 })

        const kid = randomUUID()
        const pair = generateKeyPair()

        await fs.writeFile(path.join(directory, `${kid}.key`), pair.privateKey, { mode: 0o600 })
        await fs.writeFile(path.join(directory, `${kid}.pub`), pair.publicKey, { mode: 0o644 })
        await fs.writeFile(path.join(directory, ACTIVE_FILE), kid, { mode: 0o644 })

        return kid
    }

    private async ensure(name: SigningKeyName): Promise<string> {
        try {
            const kid = await this.readActiveKid(name)
            await fs.access(path.join(this.dirFor(name), `${kid}.key`))
            return kid
        } catch {
            const kid = await this.create(name)
            log.info(`generated signing key ${name} (${kid})`)
            return kid
        }
    }

    private assertName(name: string): SigningKeyName {
        if (!isSigningKeyName(name)) {
            throw new NotFoundError('signing_key_not_found', `unknown signing key ${name}`, [name])
        }
        return name
    }

    async init(): Promise<void> {
        for (const name of SIGNING_KEYS) {
            await this.ensure(name)
        }
    }

    async describe(name: SigningKeyName): Promise<SigningKey> {
        const kid = await this.ensure(name)
        const directory = this.dirFor(name)

        try {
            const publicKey = await fs.readFile(path.join(directory, `${kid}.pub`), 'utf8')
            const stats = await fs.stat(path.join(directory, `${kid}.key`))
            const entries = await fs.readdir(directory)

            const retiredKids = entries
                .filter((entry) => entry.endsWith('.pub'))
                .map((entry) => entry.slice(0, -4))
                .filter((entry) => entry !== kid)
                .sort()

            return {
                name,
                label: SIGNING_KEY_LABELS[name],
                kid,
                algorithm: SIGNING_ALGORITHM,
                publicKey,
                createdAt: stats.mtime.toISOString(),
                retiredKids,
            }
        } catch (error) {
            log.error(`unable to read signing key ${name}`, error)
            throw new UnavailableError('signing_key_unavailable', `signing key ${name} unreadable`, [name])
        }
    }

    async list(): Promise<SigningKey[]> {
        const keys: SigningKey[] = []
        for (const name of SIGNING_KEYS) {
            keys.push(await this.describe(name))
        }
        return keys
    }

    async rotate(name: string): Promise<SigningKey> {
        const resolved = this.assertName(name)
        const kid = await this.create(resolved)
        log.info(`rotated signing key ${resolved} (${kid})`)
        return this.describe(resolved)
    }

    async sign(
        name: string,
        payload: Record<string, unknown>,
        options: SignOptions = {}
    ): Promise<SignedToken> {
        const resolved = this.assertName(name)
        const kid = await this.ensure(resolved)

        const ttl = Math.min(
            Math.max(options.expiresInSeconds ?? SIGNING_TTL_SECONDS, 1),
            SIGNING_MAX_TTL_SECONDS
        )

        const issuedAt = Math.floor(Date.now() / 1000)
        const expiresAt = issuedAt + ttl

        const claims: Record<string, unknown> = {
            ...payload,
            iss: SIGNING_ISSUER,
            iat: issuedAt,
            exp: expiresAt,
        }
        if (options.audience) claims.aud = options.audience
        if (options.subject) claims.sub = options.subject

        try {
            const privateKey = await fs.readFile(path.join(this.dirFor(resolved), `${kid}.key`), 'utf8')
            const token = signJwt(privateKey, { alg: SIGNING_ALGORITHM, typ: 'JWT', kid }, claims)
            return { token, kid, expiresAt: new Date(expiresAt * 1000).toISOString() }
        } catch (error) {
            log.error(`unable to sign with ${resolved}`, error)
            throw new UnavailableError('signing_key_unavailable', `signing key ${resolved} unusable`, [resolved])
        }
    }
}
