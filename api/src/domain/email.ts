import type { EmailProvider } from '../contracts/index.js'
import { getLogger } from '../logging.js'

const log = getLogger('email')

export type OutgoingEmail = {
    id: string
    toEmail: string
    toName: string
    subject: string
    body: string
}

export type EmailSender = {
    fromName: string
    fromEmail: string

    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    smtpSecure: boolean

    mailchimpKey: string
}

export type SendResult = {
    id: string
    ok: boolean
    error?: string
}

export type EmailPort = {
    id: EmailProvider

    batchSize: number

    ready(sender: EmailSender): boolean

    send(messages: OutgoingEmail[], sender: EmailSender): Promise<SendResult[]>
}

const registry = new Map<EmailProvider, EmailPort>()

export const registerEmailPort = (port: EmailPort): void => {
    registry.set(port.id, port)
}

export const getEmailPort = (id: EmailProvider): EmailPort | undefined => registry.get(id)

export const renderTemplate = (template: string, context: Record<string, string>): string =>
    template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, key: string) => context[key] ?? '')

export const logEmailPort: EmailPort = {
    id: 'log',

    batchSize: 50,

    ready(): boolean {
        return true
    },

    async send(messages: OutgoingEmail[], sender: EmailSender): Promise<SendResult[]> {
        for (const message of messages) {
            log.info('email (log provider)', {
                from: `${sender.fromName} <${sender.fromEmail}>`,
                to: message.toEmail,
                subject: message.subject,
            })
        }
        return messages.map((message) => ({ id: message.id, ok: true }))
    },
}

export const smtpEmailPort: EmailPort = {
    id: 'smtp',

    batchSize: 20,

    ready(sender: EmailSender): boolean {
        return Boolean(sender.smtpHost && sender.fromEmail)
    },

    async send(messages: OutgoingEmail[], sender: EmailSender): Promise<SendResult[]> {
        const { createTransport } = await import('nodemailer')
        const transport = createTransport({
            host: sender.smtpHost,
            port: sender.smtpPort || 587,
            secure: sender.smtpSecure,
            auth: sender.smtpUser ? { user: sender.smtpUser, pass: sender.smtpPassword } : undefined,
        })

        const results: SendResult[] = []
        for (const message of messages) {
            try {
                await transport.sendMail({
                    from: `${sender.fromName} <${sender.fromEmail}>`,
                    to: message.toName ? `${message.toName} <${message.toEmail}>` : message.toEmail,
                    subject: message.subject,
                    text: message.body,
                })
                results.push({ id: message.id, ok: true })
            } catch (error) {
                results.push({ id: message.id, ok: false, error: error instanceof Error ? error.message : 'send failed' })
            }
        }
        transport.close()
        return results
    },
}

export const mailchimpEmailPort: EmailPort = {
    id: 'mailchimp',

    batchSize: 100,

    ready(sender: EmailSender): boolean {
        return Boolean(sender.mailchimpKey && sender.fromEmail)
    },

    async send(messages: OutgoingEmail[], sender: EmailSender): Promise<SendResult[]> {
        const results: SendResult[] = []

        for (const message of messages) {
            try {
                const response = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: sender.mailchimpKey,
                        message: {
                            from_email: sender.fromEmail,
                            from_name: sender.fromName,
                            subject: message.subject,
                            text: message.body,
                            to: [{ email: message.toEmail, name: message.toName || undefined, type: 'to' }],
                        },
                    }),
                })
                if (!response.ok) {
                    results.push({ id: message.id, ok: false, error: `mailchimp responded ${response.status}` })
                    continue
                }
                const payload = (await response.json()) as Array<{ status?: string; reject_reason?: string }>
                const entry = payload[0]
                const rejected = entry?.status === 'rejected' || entry?.status === 'invalid'
                results.push(
                    rejected
                        ? { id: message.id, ok: false, error: entry?.reject_reason || entry?.status || 'rejected' }
                        : { id: message.id, ok: true }
                )
            } catch (error) {
                results.push({ id: message.id, ok: false, error: error instanceof Error ? error.message : 'send failed' })
            }
        }

        return results
    },
}

registerEmailPort(logEmailPort)
registerEmailPort(smtpEmailPort)
registerEmailPort(mailchimpEmailPort)
