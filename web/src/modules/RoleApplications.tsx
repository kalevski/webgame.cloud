import React, { useEffect } from 'react'
import ModuleActions from 'components/ModuleActions'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { formatDateTime } from 'helpers/dates'
import { MODAL, useModalOpen } from 'modals'
import { RoleApplication } from 'types'

const STATUS_VARIANT: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'secondary',
}

const RoleApplications: React.FC = () => {
    const { t } = useStrings()
    const r = t.roleApplications

    const openRoles = useStore((state) => state.openRoles)
    const myApplications = useStore((state) => state.myApplications)
    const loaded = useStore((state) => state.myApplicationsLoaded)
    const fetchMyRoleApplications = useStore((state) => state.fetchMyRoleApplications)
    const withdrawRoleApplication = useStore((state) => state.withdrawRoleApplication)

    const openApply = useModalOpen<RoleApplication | null, void>(MODAL.ROLE_APPLICATION)

    useEffect(() => {
        void fetchMyRoleApplications()
    }, [fetchMyRoleApplications])

    const pending = myApplications.find((application) => application.status === 'pending') ?? null

    const applicationRow = (application: RoleApplication): string =>
        `<li class="tc-data-list__row" data-id="${escapeHtml(application.id)}">` +
        `<div class="tc-data-list__text">` +
        `<span class="tc-data-list__primary">${escapeHtml(application.roleName)}` +
        `<tc-badge variant="${STATUS_VARIANT[application.status] ?? 'secondary'}">` +
        `${escapeHtml(r.statusLabels[application.status] ?? application.status)}</tc-badge>` +
        `</span>` +
        `<span class="tc-data-list__secondary">${escapeHtml(
            [
                formatDateTime(application.createdAt),
                application.decisionNote,
                application.decidedByName ? r.decidedBy(application.decidedByName) : '',
            ].filter(Boolean).join(' · ')
        )}</span>` +
        `</div>` +
        (application.status === 'pending'
            ? `<span class="table-actions">` +
              `<tc-button variant="secondary" outline size="sm" data-action="withdraw">${escapeHtml(r.withdraw)}</tc-button>` +
              `</span>`
            : '') +
        `</li>`

    const applicationList = useTc<HTMLElement>({
        items: myApplications,
        renderRow: applicationRow,
        onAction: (detail: { action: string; id: string }) => {
            const application = myApplications.find((entry) => entry.id === detail.id)
            if (!application) return
            if (detail.action === 'withdraw' && window.confirm(r.withdrawPrompt(application.roleName))) {
                void withdrawRoleApplication(application.id)
            }
        },
    })

    return (
        <div className="module module-role-applications">
            <ModuleActions>
                {openRoles.length > 0 && !pending && (
                    <tc-button variant="primary" size="sm" onClick={() => openApply()}>
                        {r.apply}
                    </tc-button>
                )}
            </ModuleActions>

            <tc-section-card title={r.title} icon="BadgeCheck">

                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{r.intro}</tc-text>

                    {pending && <tc-alert variant="info">{r.pendingNotice(pending.roleName)}</tc-alert>}

                    {loaded && openRoles.length === 0 && !pending && (
                        <tc-alert variant="secondary">{r.noneOpen}</tc-alert>
                    )}

                    {loaded && myApplications.length === 0 ? (
                        <tc-empty-state
                            icon="BadgeCheck"
                            heading={r.emptyHeading}
                            description={r.emptyDescription}
                        ></tc-empty-state>
                    ) : (
                        <tc-data-list ref={applicationList}></tc-data-list>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default RoleApplications
