import { useCallback } from 'react'
import { ENTITLEMENTS, Entitlement } from 'configs/entitlements'
import { MODAL } from 'modals/keys'
import { useModalOpen } from 'modals/registry'
import useCan from 'hooks/useCan'
import { useStore } from 'state'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { Permission } from 'types'

export type Lock = {
    locked: boolean

    roleName: string | null

    open: () => void

    entitlement: Entitlement | null
}

const useLock = (permission: Permission): Lock => {
    const allowed = useCan(permission)
    const upgradePlanName = useStore((state) => state.upgradePlanName)
    const entitlement = ENTITLEMENTS[permission]
    const openUpgrade = useModalOpen<void, Entitlement>(MODAL.UPGRADE)
    const open = useCallback(() => {
        if (!entitlement) return

        trackEvent(EVENT.PAYWALL_CLICK, { feature: entitlement.feature })
        openUpgrade(entitlement)
    }, [entitlement, openUpgrade])
    const planName = entitlement ? upgradePlanName : null
    return {
        locked: !allowed && entitlement !== undefined && planName !== null,
        roleName: planName,
        open,
        entitlement: entitlement ?? null,
    }
}

export const useLimitLock = (reached: boolean, entitlement: Entitlement): Lock => {
    const openUpgrade = useModalOpen<void, Entitlement>(MODAL.UPGRADE)
    const upgradePlanName = useStore((state) => state.upgradePlanName)
    const open = useCallback(() => {
        trackEvent(EVENT.PAYWALL_CLICK, { feature: entitlement.feature })
        openUpgrade(entitlement)
    }, [openUpgrade, entitlement])
    return { locked: reached, roleName: upgradePlanName, open, entitlement }
}

export default useLock
