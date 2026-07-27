import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { EmailTemplate } from 'types'

const EmailTemplatesAdmin: React.FC = () => {
    const { t } = useStrings()
    const e = t.email
    const templates = useStore((state) => state.emailTemplates)
    const fetchEmailTemplates = useStore((state) => state.fetchEmailTemplates)

    const canWrite = useCan('email.template.write')

    const openTemplate = useModalOpen<{ key: string } | null, EmailTemplate | null>(MODAL.EMAIL_TEMPLATE)

    useEffect(() => {
        void fetchEmailTemplates()
    }, [fetchEmailTemplates])

    const header = useTc<HTMLElement>({
        actions: canWrite ? [{ key: 'new', label: e.newTemplate, icon: 'Plus', variant: 'primary' }] : [],
        onExec: (key: string) => {
            if (key === 'new') openTemplate(null)
        },
    })

    useEffect(() => {
        const content = header.current?.querySelector('.tc-action-header-content')
        if (content) content.textContent = e.templatesTitle
    })

    const readOnlyList = useTc<HTMLElement>({
        items: templates.map((template) => ({
            id: template.key,
            label: `${template.name}${template.active ? '' : ' · —'}`,
            secondary: `${template.subject} · ${template.description || template.key}`,
        })),
    })

    const list = useTc<HTMLElement>({
        actions: templates.map((template) => ({
            key: template.key,
            title: `${template.name}${template.active ? '' : ' · —'}`,
            description: `${template.subject} · ${template.description || template.key}`,
            ...(canWrite ? { label: e.editTemplate, variant: 'secondary', icon: 'Pencil' } : {}),
        })),
        onActionClick: (key: string) => {
            const template = templates.find((entry) => entry.key === key)
            if (template) openTemplate(template)
        },
    })

    return (
        <div className="module module-email-templates">
            <tc-action-header ref={header} className="module-email__action-header"></tc-action-header>

            <tc-section-card title={e.templatesTitle}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{e.templatesIntro}</tc-text>

                    {templates.length === 0 && <tc-empty-state icon="mail">{e.templatesEmpty}</tc-empty-state>}

                    {templates.length > 0 && canWrite && (
                        <tc-action-row-list ref={list} outline trailing-icon="none"></tc-action-row-list>
                    )}

                    {templates.length > 0 && !canWrite && <tc-data-list ref={readOnlyList}></tc-data-list>}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default EmailTemplatesAdmin
