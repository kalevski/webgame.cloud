import { inject, injectable } from 'tsyringe'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { User } from '../contracts/index.js'
import { UnauthorizedError, ValidationError } from '../domain/errors.js'
import { WEB_URL, WORKSPACE_NAME } from '../env.js'
import { getLogger } from '../logging.js'
import { AuthTokenRepository } from '../repositories/auth/AuthTokenRepository.js'
import { AuthService } from './AuthService.js'
import { EmailService } from './EmailService.js'
import { SettingsService } from './SettingsService.js'
import { UserRepository } from '../repositories/users/UserRepository.js'

const log = getLogger('magic-link')

const TOKEN_MINUTES = 15

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

@injectable()
export class MagicLinkService {
    constructor(
        @inject(AuthTokenRepository) private tokens: AuthTokenRepository,
        @inject(AuthService) private auth: AuthService,
        @inject(EmailService) private email: EmailService,
        @inject(SettingsService) private settings: SettingsService,
        @inject(UserRepository) private users: UserRepository
    ) {}

    async request(rawEmail: string, ip: string): Promise<void> {
        const email = rawEmail.trim().toLowerCase()
        if (!EMAIL_PATTERN.test(email)) {
            throw new ValidationError('email_invalid', 'a valid email is required')
        }

        const known = await this.users.findByEmail(email)
        if (!known && !(await this.settings.getSignupsOpen())) {
            log.info('magic link suppressed, signups closed', { email })
            return
        }

        const token = randomBytes(32).toString('base64url')
        await this.tokens.insertLoginToken({
            id: randomUUID(),
            email,
            tokenHash: hashToken(token),
            ip,
            minutes: TOKEN_MINUTES,
        })

        const link = `${WEB_URL || ''}/auth/magic/${token}`
        await this.email.queueDirect({
            toEmail: email,
            toName: known?.name ?? '',
            subject: `Sign in to ${WORKSPACE_NAME}`,
            body: [
                `Use this link to sign in to ${WORKSPACE_NAME}:`,
                '',
                link,
                '',
                `The link works once and expires in ${TOKEN_MINUTES} minutes.`,
                'If you did not ask for it, ignore this email.',
            ].join('\n'),
        })
    }

    async consume(token: string): Promise<User> {
        const row = await this.tokens.consumeLoginToken(hashToken(token))
        if (!row) throw new UnauthorizedError('magic_link_invalid', 'link expired or already used')

        return this.auth.resolveDevUser(row.email, row.email.split('@')[0] ?? '')
    }
}
