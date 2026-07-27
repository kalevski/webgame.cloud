import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import LockChip from 'components/LockChip'
import { Lock } from 'hooks/useLock'
import { EVENT } from 'configs/analytics'
import { trackOnce } from 'helpers/analytics'

type UpgradeNudgeProps = {
    lock: Lock

    feature: string
}

const UpgradeNudge: React.FC<UpgradeNudgeProps> = ({ lock, feature }) => {
    const { t } = useStrings()

    useEffect(() => {
        if (!lock.locked) return
        trackOnce(`paywall:${feature}:nudge`, EVENT.PAYWALL_VIEW, {
            feature,
            surface: 'nudge',
        })
    }, [lock.locked, feature])

    if (!lock.locked) return null
    const copy = t.upgrade.features[feature as keyof typeof t.upgrade.features]
    return (
        <div className="upgrade-nudge">
            <LockChip roleName={lock.roleName} />
            <span className="upgrade-nudge__text">{copy?.blurb ?? ''}</span>
            <tc-button size="small" variant="warning" onClick={lock.open}>
                {t.upgrade.cta}
            </tc-button>
        </div>
    )
}

export default UpgradeNudge
