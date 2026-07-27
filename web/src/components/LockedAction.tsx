import React, { useEffect } from 'react'
import LockChip from 'components/LockChip'
import { Lock } from 'hooks/useLock'
import { EVENT } from 'configs/analytics'
import { trackOnce } from 'helpers/analytics'

type LockedActionProps = {
    lock: Lock

    onClick: () => void
    children: React.ReactNode
}

const LockedAction: React.FC<LockedActionProps> = ({ lock, onClick, children }) => {
    const feature = lock.entitlement?.feature
    useEffect(() => {
        if (!lock.locked || !feature) return
        trackOnce(`paywall:${feature}:action`, EVENT.PAYWALL_VIEW, {
            feature,
            surface: 'action',
        })
    }, [lock.locked, feature])

    return (
        <button
            type="button"
            className="locked-action"
            aria-disabled={lock.locked || undefined}
            onClick={lock.locked ? lock.open : onClick}
        >
            {children}
            {lock.locked && <LockChip roleName={lock.roleName} />}
        </button>
    )
}

export default LockedAction
