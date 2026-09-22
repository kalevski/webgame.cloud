import { inject, injectable } from 'tsyringe'
import type {
    DemoRequest,
    DemoResult,
    DemoScale,
    TicketStatus,
    User,
} from '../contracts/index.js'
import { DEMO_SCALES, DEMO_SEED, OWNER_ROLE_ID, toRoleId } from '../contracts/index.js'
import { IS_PRODUCTION } from '../env.js'
import { ConflictError, ValidationError } from '../domain/errors.js'
import { random, type Random } from '../domain/random.js'
import { getLogger } from '../logging.js'
import { resumeDispatch, suppressDispatch } from '../notify.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { BillingService } from './BillingService.js'
import { EmailService } from './EmailService.js'
import { ModerationService } from './ModerationService.js'
import { NotificationService } from './NotificationService.js'
import { RoleApplicationService } from './RoleApplicationService.js'
import { TicketService } from './TicketService.js'
import { UserService } from './UserService.js'
import { WebhookService } from './WebhookService.js'

const log = getLogger('demo')

type Shape = {
    members: number
    tickets: number
    reports: number
    notifications: number
}

const SHAPES: Record<DemoScale, Shape> = {
    small: { members: 6, tickets: 6, reports: 3, notifications: 8 },
    medium: { members: 40, tickets: 40, reports: 12, notifications: 40 },
    large: { members: 250, tickets: 180, reports: 40, notifications: 160 },
}

const DOMAIN = 'example.com'

const FIRST_NAMES = [
    'Ada', 'Bo', 'Cleo', 'Dara', 'Emil', 'Farah', 'Gus', 'Hana', 'Ivo', 'Juno',
    'Kit', 'Lena', 'Mio', 'Nils', 'Otto', 'Pia', 'Quinn', 'Rosa', 'Sami', 'Tove',
]

const LAST_NAMES = [
    'Adler', 'Brandt', 'Costa', 'Dahl', 'Ericsson', 'Falk', 'Grant', 'Holm',
    'Ibarra', 'Jensen', 'Kova', 'Lindqvist', 'Moreau', 'Novak', 'Ortiz', 'Pino',
]

const TICKET_SUBJECTS = [
    'Cannot upload a file', 'Invoice shows the wrong plan', 'Export takes forever',
    'Notification arrived twice', 'Sign-in loop on Safari', 'Quota reads as zero',
    'Webhook retries stopped', 'Search misses recent rows',
]

const TICKET_STATES: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed']

const isScale = (value: string): value is DemoScale => (DEMO_SCALES as readonly string[]).includes(value)

@injectable()
export class DemoDataService {
    constructor(
        @inject(UserRepository) private users: UserRepository,
        @inject(UserService) private userService: UserService,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(TicketService) private tickets: TicketService,
        @inject(ModerationService) private moderation: ModerationService,
        @inject(RoleApplicationService) private applications: RoleApplicationService,
        @inject(NotificationService) private notifications: NotificationService,
        @inject(BillingService) private billing: BillingService,
        @inject(EmailService) private email: EmailService,
        @inject(WebhookService) private webhooks: WebhookService
    ) {}

    async seed(request: DemoRequest): Promise<DemoResult> {
        if (IS_PRODUCTION) {
            throw new ConflictError('demo_refused_production', 'the demo dataset is never seeded into production')
        }

        const scale = request.scale ?? 'small'
        if (!isScale(scale)) throw new ValidationError('invalid_input', `unknown scale ${scale}`)

        const owner = await this.owner()
        if (!owner) {
            throw new ConflictError(
                'demo_refused_no_owner',
                'sign in once first — the demo dataset is written by the owner account'
            )
        }

        const existing = await this.users.list()
        const people = existing.filter((user) => user.kind !== 'service')
        if (people.length > 1 && !request.force) {
            throw new ConflictError(
                'demo_refused_populated',
                'this database already holds accounts — force layers a SECOND dataset on top, '
                + 'it does not replace the first; to start over, drop the database and migrate'
            )
        }

        const seed = request.seed ?? DEMO_SEED
        const rng = random(`${seed}:${scale}`)
        const shape = SHAPES[scale]
        const started = Date.now()
        const created: Record<string, number> = {}
        const bump = (key: string, by = 1): void => { created[key] = (created[key] ?? 0) + by }

        let suppressedDispatches = 0
        suppressDispatch()
        try {
            const roles = await this.seedRoles(bump)
            const members = await this.seedMembers(owner, rng, shape, roles, bump)
            await this.seedOverrides(members, rng, bump)
            await this.seedTickets(owner, members, rng, shape, bump)
            await this.seedReports(owner, members, rng, shape, bump)
            await this.seedApplications(owner, members, roles, rng, bump)
            await this.seedNotifications(members, rng, shape, bump)
            await this.seedBilling(members, rng, bump)
            await this.seedEmail(bump)
            await this.seedWebhooks(bump)
        } finally {
            suppressedDispatches = resumeDispatch()
        }

        const accounts = (await this.users.list())
            .filter((user) => user.email.endsWith(`@${DOMAIN}`))
            .map((user) => `${user.email} (${user.role})`)
            .sort()

        const result: DemoResult = {
            scale,
            seed,
            accounts,
            created,
            suppressedDispatches,
            tookMs: Date.now() - started,
        }
        log.info('demo dataset seeded', { scale, seed, tookMs: result.tookMs, ...created })
        return result
    }

    private async owner(): Promise<User | null> {
        const users = await this.users.list()
        return users.find((user) => user.role === OWNER_ROLE_ID) ?? null
    }

    private async seedRoles(bump: (key: string, by?: number) => void): Promise<string[]> {
        const wanted = [
            {
                id: 'demo-reviewer',
                name: 'Reviewer',
                permissions: ['moderation.queue.read', 'audit.read'],
                applicable: true,
                applicationPrompt: 'What review work have you done before?',
            },
            {
                id: 'demo-builder',
                name: 'Builder',
                permissions: ['ticket.create', 'file.upload'],
                applicable: false,
                applicationPrompt: '',
            },
        ] as const

        const ids: string[] = []
        for (const draft of wanted) {
            const body = {
                id: draft.id,
                name: draft.name,
                permissions: [...draft.permissions],
                applicable: draft.applicable,
                applicationPrompt: draft.applicationPrompt,
            }

            const updated = await this.access.saveRole(body, toRoleId(draft.id)).catch(() => null)
            if (updated) {
                ids.push(updated.id)
                continue
            }

            const created = await this.access.saveRole(body)
            ids.push(created.id)
            bump('roles')
        }
        return ids
    }

    private async seedMembers(
        owner: User,
        rng: Random,
        shape: Shape,
        roles: string[],
        bump: (key: string, by?: number) => void
    ): Promise<User[]> {
        const members: User[] = []

        for (let index = 0; index < shape.members; index += 1) {
            const first = rng.pick(FIRST_NAMES)
            const last = rng.pick(LAST_NAMES)
            const email = `${first.toLowerCase()}.${last.toLowerCase()}${index}@${DOMAIN}`
            const existing = await this.users.findByEmail(email)
            if (existing) {
                members.push(existing)
                continue
            }

            const role = index % 5 === 0 ? rng.pick(roles) : undefined
            const created = await this.userService.createProvisioned(owner, {
                email,
                name: `${first} ${last}`,
                role,
            })
            members.push(created)
            bump('accounts')
        }

        const deactivated = members[1]
        if (deactivated) {
            await this.userService.update(owner, deactivated.id, { active: false })
            bump('deactivatedAccounts')
        }

        return members.filter((member) => member.id !== deactivated?.id)
    }

    private async seedOverrides(
        members: User[],
        rng: Random,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        for (const member of members.slice(0, Math.max(1, Math.floor(members.length / 8)))) {
            await this.access.saveUserOverrides(member.id, {
                permissions: { 'ticket.queue.read': rng.chance(0.5) },
                limits: { tickets: rng.int(2, 8) },
            })
            bump('accessOverrides')
        }
    }

    private async seedTickets(
        owner: User,
        members: User[],
        rng: Random,
        shape: Shape,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        for (let index = 0; index < shape.tickets; index += 1) {
            const author = rng.pick(members)
            const thread = await this.tickets.create(author, {
                subject: `${rng.pick(TICKET_SUBJECTS)} (#${index + 1})`,
                body: 'Seeded by the demo dataset. Steps to reproduce are deliberately vague.',
            }).catch(() => null)
            if (!thread) {
                bump('quotaRefusals')
                continue
            }
            bump('tickets')

            if (rng.chance(0.6)) {
                await this.tickets.reply(owner, thread.ticket.id, 'Looking into it now.', false)
                bump('ticketReplies')
            }
            if (rng.chance(0.3)) {
                await this.tickets.reply(owner, thread.ticket.id, 'Internal: probably the quota editor.', true)
                bump('ticketInternalNotes')
            }

            const status = TICKET_STATES[index % TICKET_STATES.length]
            await this.tickets.update(thread.ticket.id, {
                status,
                assigneeId: rng.chance(0.5) ? owner.id : null,
            })
        }
    }

    private async seedReports(
        owner: User,
        members: User[],
        rng: Random,
        shape: Shape,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        for (let index = 0; index < shape.reports; index += 1) {
            const reporter = rng.pick(members)
            const target = rng.pick(members).id

            const report = await this.moderation.report(
                reporter,
                'user',
                target,
                'Seeded by the demo dataset.'
            ).catch(() => null)
            if (!report) continue
            bump('reports')

            if (index % 3 === 0) {
                await this.moderation.resolveReport(owner, report.id, 'Reviewed, no action needed.')
                bump('resolvedReports')
            }
        }
    }

    private async seedApplications(
        owner: User,
        members: User[],
        roles: string[],
        rng: Random,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        const applicable = roles[0]
        if (!applicable) return

        const applicants = rng.shuffle(members).slice(0, Math.min(6, members.length))
        for (const [index, applicant] of applicants.entries()) {
            const application = await this.applications.apply(applicant, {
                roleId: applicable,
                message: 'I have reviewed queues before and would like to help here.',
            }).catch(() => null)
            if (!application) continue
            bump('roleApplications')

            if (index === 0) continue
            await this.applications.decide(owner, application.id, {
                approve: index % 2 === 0,
                note: index % 2 === 0 ? '' : 'Not enough context yet — please reapply.',
            }).catch(() => undefined)
            bump('decidedRoleApplications')
        }
    }

    private async seedNotifications(
        members: User[],
        rng: Random,
        shape: Shape,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        for (let index = 0; index < shape.notifications; index += 1) {
            const member = rng.pick(members)
            await this.notifications.notify(
                member.id,
                'system',
                rng.pick([
                    'Your export is ready',
                    'Your role application was reviewed',
                    'A ticket you opened was answered',
                ]),
                '/profile',
                {}
            )
            bump('notifications')
        }

        for (const member of members.slice(0, Math.max(1, Math.floor(members.length / 3)))) {
            await this.notifications.markRead(member.id)
        }
    }

    private async seedBilling(
        members: User[],
        rng: Random,
        bump: (key: string, by?: number) => void
    ): Promise<void> {
        const plans = await this.billing.listAllPlans()
        if (plans.length === 0) return

        const paid = plans.find((plan) => plan.priceCents > 0) ?? plans[0]

        for (const member of rng.shuffle(members).slice(0, Math.max(1, Math.floor(members.length / 4)))) {
            await this.billing.applySubscription(member.id, {
                status: rng.chance(0.75) ? 'active' : 'canceled',
                planId: paid.id,
                currentPeriodEnd: rng.daysAgo(-30, -1).toISOString(),
            }).catch(() => undefined)
            bump('subscriptions')

            await this.billing.createInvoice({
                userId: member.id,
                planId: paid.id,
                amountCents: paid.priceCents || 2900,
                status: rng.chance(0.7) ? 'paid' : 'open',
            }).catch(() => undefined)
            bump('invoices')
        }
    }

    private async seedEmail(bump: (key: string, by?: number) => void): Promise<void> {
        const templates = await this.email.listTemplates()
        if (templates.some((template) => template.key === 'demo-welcome')) return

        await this.email.createTemplate({
            key: 'demo-welcome',
            name: 'Welcome (demo)',
            description: 'Seeded by the demo dataset.',
            subject: 'Welcome to {{workspace}}',
            body: 'Hello {{name}},\n\nYour account is ready.\n',
            active: true,
        }).catch(() => undefined)
        bump('emailTemplates')

        await this.email.saveTrigger({
            action: 'create_user',
            templateKey: 'demo-welcome',
            recipient: 'actor',
            active: false,
        }).catch(() => undefined)
        bump('emailTriggers')
    }

    private async seedWebhooks(bump: (key: string, by?: number) => void): Promise<void> {
        const endpoints = await this.webhooks.listEndpoints().catch(() => [])
        if (endpoints.length > 0) return

        await this.webhooks.createEndpoint({
            url: 'https://webhook.example.com/webgame',
            description: 'Seeded by the demo dataset — a placeholder that never resolves.',
            events: ['create_ticket', 'delete_account'],
            active: false,
        }).catch(() => undefined)
        bump('webhookEndpoints')
    }
}
