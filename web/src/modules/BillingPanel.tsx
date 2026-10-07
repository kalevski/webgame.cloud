import React, { useEffect, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { formatMoney } from 'helpers/money'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { ACTIVE_SUBSCRIPTION_STATUSES, CheckoutOutcome, Plan } from 'types'
import { formatDate } from 'helpers/dates'

const formatPrice = (plan: Plan): string =>
    plan.priceCents === 0 ? '' : formatMoney(plan.priceCents, plan.currency)

type PlanCardProps = {
    plan: Plan
    current: boolean
    actionLabel: string
    disabled: boolean
    onChoose: (plan: Plan) => void
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, current, actionLabel, disabled, onChoose }) => {
    const { t } = useStrings()
    const b = t.billing

    const card = useTc<HTMLElement>({
        features: plan.features.length > 0 ? plan.features : [plan.description].filter(Boolean),
        action: {
            label: actionLabel,
            variant: current || disabled ? 'secondary' : 'primary',
            disabled: current || disabled,
            onClick: () => onChoose(plan),
        },
    })

    return (
        <tc-pricing-card
            ref={card}
            className="module-billing__plan"
            name={plan.name}
            price={formatPrice(plan) || b.freePrice}
            period={plan.priceCents === 0 ? undefined : plan.interval === 'year' ? b.perYear : b.perMonth}
            description={plan.description || undefined}
            badge-text={current ? b.currentPlanBadge : plan.mode === 'manual' ? b.modeManual : undefined}
            highlight={current || undefined}
        ></tc-pricing-card>
    )
}

const BillingPanel: React.FC = () => {
    const { t } = useStrings()
    const b = t.billing
    const plans = useStore((state) => state.plans)
    const subscription = useStore((state) => state.subscription)
    const billingLoaded = useStore((state) => state.billingLoaded)
    const fetchBilling = useStore((state) => state.fetchBilling)
    const startCheckout = useStore((state) => state.startCheckout)
    const cancelSubscription = useStore((state) => state.cancelSubscription)
    const resumeSubscription = useStore((state) => state.resumeSubscription)
    const openBillingPortal = useStore((state) => state.openBillingPortal)
    const myEnquiry = useStore((state) => state.myEnquiry)

    const [outcome, setOutcome] = useState<CheckoutOutcome | null>(null)

    const openContactSales = useModalOpen<{ planId: string } | null, Plan>(MODAL.CONTACT_SALES, () => {
        setOutcome(null)
    })

    useEffect(() => {
        void fetchBilling()
    }, [fetchBilling])

    const active = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
    const currentPlan = plans.find((plan) => plan.id === subscription.planId) ?? null

    const summaryBadges = useTc<HTMLElement>({
        badges: [
            { label: b.statusLabels[subscription.status], variant: active ? 'success' : 'secondary' },
            ...(subscription.cancelAtPeriodEnd ? [{ label: b.cancelPending, variant: 'warning' }] : []),
        ],
    })

    const priceLine = currentPlan
        ? b.price(
            formatMoney(currentPlan.priceCents, currentPlan.currency),
            currentPlan.interval === 'year' ? b.intervalYear : b.intervalMonth
        )
        : b.freePlanHint

    const choose = (plan: Plan) => {
        if (myEnquiry) return
        if (plan.mode === 'manual') {
            setOutcome(null)
            openContactSales(plan)
            return
        }
        void startCheckout(plan.id).then((intent) => {
            if (intent) setOutcome(intent.outcome)
        })
    }

    const actionLabel = (plan: Plan): string => {
        if (plan.id === subscription.planId && active) return b.currentBadge
        if (plan.mode === 'manual' && myEnquiry) return b.enquiryPendingAction
        return plan.mode === 'manual' ? b.contactSalesAction : b.subscribe
    }

    return (
        <div className="module-billing">
            <tc-section-card title={b.currentPlanTitle} className="module-billing__current">
                <div className="module-billing__summary">
                    <div className="module-billing__summary-head">
                        <div className="module-billing__summary-identity">
                            <span className="module-billing__eyebrow">{b.planLabel}</span>
                            <h3 className="module-billing__plan-name">{currentPlan?.name ?? b.freePlanName}</h3>
                            <p className="module-billing__plan-price">{priceLine}</p>
                        </div>
                        <tc-badge-row ref={summaryBadges} size="sm"></tc-badge-row>
                    </div>

                    <div className="module-billing__facts">
                        {subscription.currentPeriodEnd && (
                            <tc-metric-tile
                                label={subscription.cancelAtPeriodEnd ? b.endsLabel : b.renewsLabel}
                                value={formatDate(subscription.currentPeriodEnd)}
                                icon="CalendarClock"
                            ></tc-metric-tile>
                        )}

                        {subscription.startedAt && (
                            <tc-metric-tile
                                label={b.startedLabel}
                                value={formatDate(subscription.startedAt)}
                                icon="Clock"
                            ></tc-metric-tile>
                        )}
                    </div>

                    {active && (
                        <div className="module-billing__summary-actions">
                            {subscription.provider !== 'manual' && (
                                <tc-button variant="secondary" outline onClick={() => void openBillingPortal()}>
                                    {b.manageBilling}
                                </tc-button>
                            )}
                            {subscription.cancelAtPeriodEnd ? (
                                <tc-button variant="primary" onClick={() => void resumeSubscription()}>
                                    {b.resume}
                                </tc-button>
                            ) : (
                                <tc-button variant="danger" outline onClick={() => void cancelSubscription()}>
                                    {b.cancel}
                                </tc-button>
                            )}
                        </div>
                    )}
                </div>
            </tc-section-card>

            <tc-section-card title={b.plansTitle} icon="Layers" className="module-billing__plans">
                <tc-stack direction="vertical" gap="0.85rem">
                    {billingLoaded && plans.length === 0 ? (
                        <tc-empty-state
                            icon="credit-card"
                            heading={b.notConnectedTitle}
                            description={b.notConnectedHint}
                        ></tc-empty-state>
                    ) : (
                        <div className="module-billing__plan-grid">
                            {plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    current={plan.id === subscription.planId && active}
                                    actionLabel={actionLabel(plan)}
                                    disabled={plan.mode === 'manual' && myEnquiry !== null}
                                    onChoose={choose}
                                />
                            ))}
                        </div>
                    )}

                    {myEnquiry && (
                        <tc-alert variant="info">
                            {b.enquiryPendingHint(myEnquiry.planName ?? b.freePlanName, b.enquiryStatusLabels[myEnquiry.status])}
                        </tc-alert>
                    )}

                    {outcome === 'unavailable' && (
                        <tc-alert variant="warning">{b.unavailableTitle}</tc-alert>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default BillingPanel
