import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import type { EmailMessageRow, EmailTemplateRow, EmailTriggerRow } from '../../schema/email.js'

import CLAIM_DUE_MESSAGES from './sql/claim-due-messages.sql'
import COUNT_MESSAGES from './sql/count-messages.sql'
import DELETE_TEMPLATE from './sql/delete-template.sql'
import DELETE_TRIGGER from './sql/delete-trigger.sql'
import INSERT_MESSAGE from './sql/insert-message.sql'
import INSERT_TEMPLATE from './sql/insert-template.sql'
import INSERT_TRIGGER from './sql/insert-trigger.sql'
import MARK_MESSAGE_FAILED from './sql/mark-message-failed.sql'
import MARK_MESSAGE_SENT from './sql/mark-message-sent.sql'
import RESET_STUCK_MESSAGES from './sql/reset-stuck-messages.sql'
import SELECT_MESSAGE from './sql/select-message.sql'
import SELECT_MESSAGES from './sql/select-messages.sql'
import SELECT_MESSAGE_STATS from './sql/select-message-stats.sql'
import SELECT_TEMPLATE from './sql/select-template.sql'
import SELECT_TEMPLATES from './sql/select-templates.sql'
import SELECT_TRIGGERS from './sql/select-triggers.sql'
import SELECT_AUDIT_ACTIONS from './sql/select-audit-actions.sql'
import SELECT_RECIPIENTS from './sql/select-recipients.sql'
import SELECT_TRIGGERS_FOR_ACTION from './sql/select-triggers-for-action.sql'
import UPDATE_MESSAGE_STATUS from './sql/update-message-status.sql'
import UPDATE_TEMPLATE from './sql/update-template.sql'

import type { CursorQuery } from '../pagination.js'

export type MessageQuery = {
    status: string | null
    templateKey: string | null
    from: Date | null
    to: Date | null
    q: string | null
    limit: number
    offset: number
    cursor?: CursorQuery
}

export type MessageWrite = {
    id: string
    toEmail: string
    toName: string
    subject: string
    body: string
    templateKey: string | null
    scheduledAt: Date | null
}

@injectable()
export class EmailRepository {
    constructor(@inject(Database) private database: Database) {}

    private run(trx?: QueryRunner): QueryRunner {
        return trx ?? this.database.pool
    }

    async listTemplates(trx?: QueryRunner): Promise<EmailTemplateRow[]> {
        const { rows } = await this.run(trx).query<EmailTemplateRow>(SELECT_TEMPLATES)
        return rows
    }

    async findTemplate(key: string, trx?: QueryRunner): Promise<EmailTemplateRow | undefined> {
        const { rows } = await this.run(trx).query<EmailTemplateRow>(SELECT_TEMPLATE, [key])
        return rows[0]
    }

    async insertTemplate(
        write: { key: string; name: string; description: string; subject: string; body: string; active: boolean },
        trx?: QueryRunner
    ): Promise<EmailTemplateRow | undefined> {
        await this.run(trx).query(INSERT_TEMPLATE, [
            write.key, write.name, write.description, write.subject, write.body, write.active,
        ])
        return this.findTemplate(write.key, trx)
    }

    async updateTemplate(
        key: string,
        patch: { name?: string; description?: string; subject?: string; body?: string; active?: boolean },
        trx?: QueryRunner
    ): Promise<EmailTemplateRow | undefined> {
        const result = await this.run(trx).query(UPDATE_TEMPLATE, [
            key,
            patch.name ?? null,
            patch.description ?? null,
            patch.subject ?? null,
            patch.body ?? null,
            patch.active ?? null,
        ])
        if ((result.rowCount ?? 0) === 0) return undefined
        return this.findTemplate(key, trx)
    }

    async deleteTemplate(key: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_TEMPLATE, [key])
        return (result.rowCount ?? 0) > 0
    }

    async listTriggers(trx?: QueryRunner): Promise<EmailTriggerRow[]> {
        const { rows } = await this.run(trx).query<EmailTriggerRow>(SELECT_TRIGGERS)
        return rows
    }

    async listTriggersForAction(action: string, trx?: QueryRunner): Promise<EmailTriggerRow[]> {
        const { rows } = await this.run(trx).query<EmailTriggerRow>(SELECT_TRIGGERS_FOR_ACTION, [action])
        return rows
    }

    async saveTrigger(
        write: {
            id: string
            action: string
            templateKey: string
            recipient: string
            roleId: string | null
            userIds: string[]
            customEmail: string
            active: boolean
        },
        trx?: QueryRunner
    ): Promise<void> {
        await this.run(trx).query(INSERT_TRIGGER, [
            write.id, write.action, write.templateKey, write.recipient,
            write.roleId, JSON.stringify(write.userIds), write.customEmail, write.active,
        ])
    }

    async listAuditActions(trx?: QueryRunner): Promise<string[]> {
        const { rows } = await this.run(trx).query<{ action: string }>(SELECT_AUDIT_ACTIONS)
        return rows.map((row) => row.action)
    }

    async listRecipients(trx?: QueryRunner): Promise<Array<{ id: string; email: string; name: string; role: string }>> {
        const { rows } = await this.run(trx).query<{ id: string; email: string; name: string; role: string }>(SELECT_RECIPIENTS)
        return rows
    }

    async deleteTrigger(id: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_TRIGGER, [id])
        return (result.rowCount ?? 0) > 0
    }

    async insertMessage(write: MessageWrite, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(INSERT_MESSAGE, [
            write.id, write.toEmail, write.toName, write.subject, write.body, write.templateKey, write.scheduledAt,
        ])
    }

    async findMessage(id: string, trx?: QueryRunner): Promise<EmailMessageRow | undefined> {
        const { rows } = await this.run(trx).query<EmailMessageRow>(SELECT_MESSAGE, [id])
        return rows[0]
    }

    async listMessages(query: MessageQuery, trx?: QueryRunner): Promise<EmailMessageRow[]> {
        const { rows } = await this.run(trx).query<EmailMessageRow>(SELECT_MESSAGES, [
            query.status, query.templateKey, query.from, query.to, query.q, query.limit, query.offset,
            query.cursor?.createdAt ?? null, query.cursor?.id ?? null,
        ])
        return rows
    }

    async countMessages(query: MessageQuery, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_MESSAGES, [
            query.status, query.templateKey, query.from, query.to, query.q,
        ])
        return Number(rows[0]?.c ?? 0)
    }

    async messageStats(trx?: QueryRunner): Promise<Array<{ status: string; count: number }>> {
        const { rows } = await this.run(trx).query<{ status: string; c: string }>(SELECT_MESSAGE_STATS)
        return rows.map((row) => ({ status: row.status, count: Number(row.c) }))
    }

    async claimDue(limit: number, trx?: QueryRunner): Promise<EmailMessageRow[]> {
        const { rows } = await this.run(trx).query<EmailMessageRow>(CLAIM_DUE_MESSAGES, [limit])
        return rows
    }

    async markSent(id: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(MARK_MESSAGE_SENT, [id])
    }

    async markFailed(id: string, error: string, maxAttempts: number, retryDelaySeconds: number, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(MARK_MESSAGE_FAILED, [id, error.slice(0, 500), maxAttempts, retryDelaySeconds])
    }

    async setStatus(id: string, status: string, trx?: QueryRunner): Promise<EmailMessageRow | undefined> {
        const result = await this.run(trx).query(UPDATE_MESSAGE_STATUS, [id, status])
        if ((result.rowCount ?? 0) === 0) return undefined
        return this.findMessage(id, trx)
    }

    async resetStuck(trx?: QueryRunner): Promise<number> {
        const result = await this.run(trx).query(RESET_STUCK_MESSAGES)
        return result.rowCount ?? 0
    }
}
