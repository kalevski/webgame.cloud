import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { EmailRecipientMode, EmailTrigger } from 'types'

const EmailTriggersAdmin: React.FC = () => {
    const { t } = useStrings()
    const e = t.email
    const triggers = useStore((state) => state.emailTriggers)
    const roles = useStore((state) => state.roles)
    const fetchEmailTriggers = useStore((state) => state.fetchEmailTriggers)
    const fetchEmailTemplates = useStore((state) => state.fetchEmailTemplates)
    const fetchEmailActions = useStore((state) => state.fetchEmailActions)
    const fetchEmailRecipients = useStore((state) => state.fetchEmailRecipients)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)
    const deleteEmailTrigger = useStore((state) => state.deleteEmailTrigger)

    const canWrite = useCan('email.trigger.write')

    const openTrigger = useModalOpen<{ action: string } | null, void>(MODAL.EMAIL_TRIGGER)

    useEffect(() => {
        void fetchEmailTriggers()
        void fetchEmailTemplates()
        void fetchEmailActions()
        void fetchEmailRecipients()
        void fetchAccessPolicy()
    }, [fetchEmailTriggers, fetchEmailTemplates, fetchEmailActions, fetchEmailRecipients, fetchAccessPolicy])

    const recipientLabels: Record<EmailRecipientMode, string> = {
        actor: e.triggerRecipientActor,
        role: e.triggerRecipientRole,
        members: e.triggerRecipientMembers,
        custom: e.triggerRecipientCustom,
    }

    const roleName = (id: string | null): string =>
        roles.find((role) => role.id === id)?.name ?? id ?? ''

    const describe = (trigger: EmailTrigger): string => {
        if (trigger.recipient === 'role') return `${recipientLabels.role}: ${roleName(trigger.roleId)}`
        if (trigger.recipient === 'members') return `${recipientLabels.members}: ${trigger.userIds.length}`
        if (trigger.recipient === 'custom') return `${recipientLabels.custom}: ${trigger.customEmail}`
        return recipientLabels.actor
    }

    const readOnlyList = useTc<HTMLElement>({
        items: triggers.map((trigger) => ({
            id: trigger.id,
            label: `${trigger.action} → ${trigger.templateName ?? trigger.templateKey}`,
            secondary: `${describe(trigger)}${trigger.active ? '' : ' · —'}`,
        })),
    })

    const list = useTc<HTMLElement>({
        actions: triggers.map((trigger) => ({
            key: trigger.id,
            title: `${trigger.action} → ${trigger.templateName ?? trigger.templateKey}`,
            description: `${describe(trigger)}${trigger.active ? '' : ' · —'}`,
            ...(canWrite ? { label: e.triggerDelete, variant: 'danger', icon: 'Trash2' } : {}),
        })),
        onActionClick: (id: string) => {
            void deleteEmailTrigger(id)
        },
    })

    return (
        <div className="module module-email-triggers">
            <tc-section-card title={e.triggersTitle} icon="Zap">
                <span slot="action" className="section-card-actions">
                    {canWrite && (
                        <tc-button variant="primary" onClick={() => openTrigger()}>
                            {e.triggerAdd}
                        </tc-button>
                    )}
                </span>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{e.triggersIntro}</tc-text>

                    {triggers.length === 0 && <tc-empty-state icon="zap">{e.triggersEmpty}</tc-empty-state>}

                    {triggers.length > 0 && canWrite && (
                        <tc-action-row-list ref={list} outline trailing-icon="none"></tc-action-row-list>
                    )}

                    {triggers.length > 0 && !canWrite && <tc-data-list ref={readOnlyList}></tc-data-list>}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default EmailTriggersAdmin
