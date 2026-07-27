import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { Entitlement } from 'configs/entitlements'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const UpgradeModal: React.FC = () => {
    const { t } = useStrings()
    const closeModal = useModalClose()
    const entitlement = useModalInput<Entitlement>(MODAL.UPGRADE)
    const upgradePlanName = useStore((state) => state.upgradePlanName)

    const copy = entitlement
        ? t.upgrade.features[entitlement.feature as keyof typeof t.upgrade.features]
        : undefined
    const roleName = entitlement ? upgradePlanName ?? '' : ''

    useEffect(() => {
        if (!entitlement) return
        trackEvent(EVENT.UPGRADE_MODAL_VIEW, { feature: entitlement.feature })
    }, [entitlement])

    return (
        <>
            <div className="modal-upgrade">
                <tc-stamp label={t.upgrade.stamp} color="warning" position="top-right"></tc-stamp>
                {roleName && <tc-badge variant="warning" text={`🔒 ${roleName}`}></tc-badge>}
                <h3 className="modal-upgrade__title">{copy?.title ?? ''}</h3>
                <p className="modal-upgrade__blurb">{copy?.blurb ?? ''}</p>
                <ul className="modal-upgrade__benefits">
                    {(copy?.benefits ?? []).map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                    ))}
                </ul>
                <p className="modal-upgrade__how">
                    <tc-currency-chip glyph="$" amount={t.upgrade.priceAmount} color="#f59e0b"></tc-currency-chip>{' '}
                    {t.upgrade.howToGet}
                </p>
            </div>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default UpgradeModal
