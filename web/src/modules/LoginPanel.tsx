import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import AppBrand from 'modules/AppBrand'
import { AUTH_METHOD_KEY } from 'helpers/analytics'
import { apiUrl } from 'helpers/api'
import { OAuthProvider, OAUTH_PROVIDERS, OAUTH_PROVIDER_LABELS } from 'types'

type ConnectOption = { key: string; label: string; variant?: string; icon?: string }

const OWNER_EMAIL = 'owner@example.com'
const OWNER_NAME = 'Owner'

const signInWith = (provider: OAuthProvider) => {
    sessionStorage.setItem(AUTH_METHOD_KEY, provider)
    window.location.href = apiUrl(`/api/auth/${provider}`)
}

const isProvider = (key: string): key is OAuthProvider =>
    (OAUTH_PROVIDERS as readonly string[]).includes(key)

const LoginPanel: React.FC = () => {
    const { t } = useStrings()
    const authConfig = useStore((state) => state.authConfig)
    const loginDev = useStore((state) => state.loginDev)
    const addAlert = useStore((state) => state.addAlert)

    useEffect(() => {
        const error = new URLSearchParams(window.location.search).get('error')
        if (!error) return
        addAlert({
            variant: 'danger',
            message: error === 'deactivated' ? t.auth.ssoDeactivated : t.auth.ssoFailed,
            dismissible: true,
        })
        window.history.replaceState(null, '', window.location.pathname)
    }, [addAlert, t.auth.ssoDeactivated, t.auth.ssoFailed])

    const loginAsOwner = () => {
        sessionStorage.setItem(AUTH_METHOD_KEY, 'dev')
        void loginDev(OWNER_EMAIL, OWNER_NAME)
    }

    const connect = useMemo<ConnectOption[]>(() => {
        const options: ConnectOption[] = (authConfig?.providers ?? []).map((provider) => ({
            key: provider,
            label: t.auth.signInWith(OAUTH_PROVIDER_LABELS[provider]),
            variant: 'primary',
            icon: 'log-in',
        }))
        if (authConfig?.devLogin) {
            options.push({ key: 'owner', label: t.auth.loginAsOwner, variant: 'secondary', icon: 'crown' })
        }
        return options
    }, [authConfig, t])

    const login = useTc<HTMLElement>(
        { connect },
        {
            'tc-connect': (event: Event) => {
                const key = (event as CustomEvent<{ key: string }>).detail?.key
                if (key && isProvider(key)) signInWith(key)
                else if (key === 'owner') loginAsOwner()
            },
        }
    )

    const ecosystem = useTc<HTMLElement>({
        core: { name: t.auth.ecosystem.coreLabel, label: null },
        rings: t.auth.ecosystem.rings,
    })

    return (
        <tc-login
            ref={login}
            title={t.auth.heroTitle}
            description={t.auth.heroSubtitle}
            background-pattern-src="/login-pattern.svg"
            loading={!authConfig || undefined}
        >
            <div slot="logo">
                <AppBrand xlarge />
            </div>

            <div slot="pattern" className="module-login__map" inert>
                <tc-ecosystem-map
                    ref={ecosystem}
                    title={t.auth.ecosystem.title}
                    size={340}
                ></tc-ecosystem-map>
            </div>
        </tc-login>
    )
}

export default LoginPanel
