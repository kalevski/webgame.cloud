import React from 'react'
import { Navigate } from 'react-router'
import { useStore } from 'state'
import useAuth from 'hooks/useAuth'
import { useCanAny } from 'hooks/useCan'
import ConsentGate from 'modules/ConsentGate'
import { consumePostLoginRedirect, savePostLoginRedirect } from 'helpers/postLoginRedirect'
import { Permission } from 'types'

type AuthGuardProps = {
    secured?: boolean

    permission?: Permission | Permission[]
    children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ secured, permission, children }) => {
    const { user, isAuthenticated, authLoaded } = useAuth()
    const impersonatedBy = useStore((state) => state.impersonatedBy)

    const required = permission === undefined ? [] : [permission].flat()
    const allowed = useCanAny(...required)

    if (!authLoaded) return null

    if (secured && !isAuthenticated) {
        savePostLoginRedirect(window.location.pathname + window.location.search)
        return <Navigate to="/login" replace />
    }

    if (!secured && isAuthenticated) return <Navigate to={consumePostLoginRedirect() ?? '/'} replace />
    if (secured && required.length > 0 && !allowed) return <Navigate to="/" replace />
    if (secured && user && user.consentedAt === null && impersonatedBy === null) return <ConsentGate />

    return <>{children}</>
}

export default AuthGuard
