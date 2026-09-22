import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { formatMoney } from 'helpers/money'
import { MODAL, useModalOpen } from 'modals'
import { Plan, PlanMode } from 'types'

const PlansAdmin: React.FC = () => {
    const { t } = useStrings()
    const p = t.plansAdmin
    const adminPlans = useStore((state) => state.adminPlans)
    const adminPlansLoaded = useStore((state) => state.adminPlansLoaded)
    const fetchAdminPlans = useStore((state) => state.fetchAdminPlans)
    const roles = useStore((state) => state.roles)

    const canWrite = useCan('billing.plan.write')

    const openPlanEditor = useModalOpen<{ planId: string } | null, Plan | null>(MODAL.PLAN_EDITOR)

    useEffect(() => {
        void fetchAdminPlans()
    }, [fetchAdminPlans])

    const modeLabel = (mode: PlanMode): string => (mode === 'manual' ? p.modeManual : p.modeManaged)

    const visibilityLabel = (plan: Plan): string =>
        plan.visibleRoleIds.length === 0
            ? ''
            : p.visibilitySummary(
                plan.visibleRoleIds
                    .map((roleId) => roles.find((role) => role.id === roleId)?.name ?? roleId)
                    .join(', ')
            )

    const readOnlyList = useTc<HTMLElement>({
        items: adminPlans.map((plan) => ({
            id: plan.id,
            label: plan.name,
            secondary: [
                `${formatMoney(plan.priceCents, plan.currency)} / ${plan.interval === 'year' ? p.intervalYear : p.intervalMonth}`,
                modeLabel(plan.mode),
                visibilityLabel(plan),
                plan.active ? '' : p.unpublished,
            ].filter(Boolean).join(' · '),
        })),
    })

    const planList = useTc<HTMLElement>({
        actions: adminPlans.map((plan) => ({
            key: plan.id,
            title: plan.name,
            description: [
                `${formatMoney(plan.priceCents, plan.currency)} / ${plan.interval === 'year' ? p.intervalYear : p.intervalMonth}`,
                modeLabel(plan.mode),
                visibilityLabel(plan),
                plan.active ? '' : p.unpublished,
            ].filter(Boolean).join(' · '),
            ...(canWrite ? { label: p.edit, variant: 'secondary', icon: 'Pencil' } : {}),
        })),
        onActionClick: (planId: string) => {
            const plan = adminPlans.find((entry) => entry.id === planId)
            if (plan) openPlanEditor(plan)
        },
    })

    return (
        <div className="module module-plans">
            <tc-section-card title={p.title}>
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{p.intro}</tc-text>

                    {adminPlansLoaded && adminPlans.length === 0 && (
                        <tc-empty-state icon="credit-card">{p.empty}</tc-empty-state>
                    )}

                    {adminPlans.length > 0 && canWrite && (
                        <tc-action-row-list ref={planList} outline trailing-icon="none"></tc-action-row-list>
                    )}

                    {adminPlans.length > 0 && !canWrite && <tc-data-list ref={readOnlyList}></tc-data-list>}

                    {canWrite && (
                        <div>
                            <tc-button variant="primary" onClick={() => openPlanEditor(null)}>
                                {p.create}
                            </tc-button>
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default PlansAdmin
