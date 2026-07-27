import { createSign, generateKeyPairSync } from 'node:crypto'

export type KeyPairPem = {
    privateKey: string
    publicKey: string
}

export type JwtHeader = {
    alg: string
    typ: 'JWT'
    kid: string
}

const encodeSegment = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

export const generateKeyPair = (): KeyPairPem =>
    generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

export const signJwt = (
    privateKey: string,
    header: JwtHeader,
    claims: Record<string, unknown>
): string => {
    const input = `${encodeSegment(header)}.${encodeSegment(claims)}`
    const signature = createSign('RSA-SHA256').update(input).end().sign(privateKey, 'base64url')
    return `${input}.${signature}`
}
