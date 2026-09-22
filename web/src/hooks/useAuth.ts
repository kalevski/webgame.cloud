import { useStore } from 'state'

const useAuth = () => {
    const me = useStore((state) => state.me)
    const authLoaded = useStore((state) => state.authLoaded)
    const slots = useStore((state) => state.slots)

    return {
        user: me,
        authLoaded,
        isAuthenticated: me !== null,

        isOwner: slots.owner,
    }
}

export default useAuth
