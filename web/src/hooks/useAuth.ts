import { useStore } from 'state'
import { UserRole } from 'types'

const useAuth = () => {
    const me = useStore((state) => state.me)
    const authLoaded = useStore((state) => state.authLoaded)
    const slots = useStore((state) => state.slots)
    const paid = useStore((state) => state.paid)

    return {
        user: me,
        authLoaded,
        isAuthenticated: me !== null,
        role: (me?.role ?? null) as UserRole | null,

        isOwner: slots.owner,

        isMember: slots.default,

        isPaid: paid,
    }
}

export default useAuth
