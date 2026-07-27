import { useEffect } from 'react'
import { useStore } from 'state'
import { setAnalyticsUser } from 'helpers/analytics'

const useTrackedIdentity = (): void => {
    const me = useStore((state) => state.me)
    const slots = useStore((state) => state.slots)
    const paid = useStore((state) => state.paid)
    const authLoaded = useStore((state) => state.authLoaded)

    useEffect(() => {
        if (!authLoaded) return
        if (!me) {
            setAnalyticsUser(null)
            return
        }
        setAnalyticsUser({
            userId: me.id,
            roleSlot: slots.owner ? 'owner' : 'member',
            isPaid: paid,

            signupCohort: me.createdAt.slice(0, 7),
        })
    }, [authLoaded, me, slots.owner, paid])
}

export default useTrackedIdentity
