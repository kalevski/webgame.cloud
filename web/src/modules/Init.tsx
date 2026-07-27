import React, { useEffect } from 'react'
import { useStore } from 'state'
import useTrackedIdentity from 'hooks/useTrackedIdentity'
import Loading from 'components/Loading'
import AppBrand from 'modules/AppBrand'
import { EVENT } from 'configs/analytics'
import { AUTH_METHOD_KEY, trackEvent } from 'helpers/analytics'

const Init: React.FC = () => {
    useTrackedIdentity()
    const authLoaded = useStore((state) => state.authLoaded)
    const me = useStore((state) => state.me)
    const fetchAuth = useStore((state) => state.fetchAuth)
    const refreshSession = useStore((state) => state.refreshSession)

    useEffect(() => {
        fetchAuth()
    }, [fetchAuth])

    useEffect(() => {
        if (!me) return
        const method = sessionStorage.getItem(AUTH_METHOD_KEY)
        if (!method) return
        sessionStorage.removeItem(AUTH_METHOD_KEY)
        trackEvent(me.consentedAt === null ? EVENT.SIGN_UP : EVENT.LOGIN, { method })
    }, [me])

    useEffect(() => {
        if (!me) return
        const onFocus = () => void refreshSession()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [me, refreshSession])

    if (!authLoaded) {
        return (
            <Loading>
                <AppBrand xlarge />
            </Loading>
        )
    }
    return null
}

export default Init
