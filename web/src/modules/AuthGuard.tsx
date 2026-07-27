import React from 'react'
import { Navigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import useCan from 'hooks/useCan'
import ConsentGate from 'modules/ConsentGate'
import { consumePostLoginRedirect, savePostLoginRedirect } from 'helpers/postLoginRedirect'
import { Permission } from 'types'

type AuthGuardProps = {
    secured?: boolean

    permission?: Permission
    children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ secured, permission, children }) => {
    const { user, isAuthenticated, authLoaded } = useAuth()

    const allowed = useCan(permission ?? ('project.write' as Permission))

    if (!authLoaded) return null

    if (secured && !isAuthenticated) {
        savePostLoginRedirect(window.location.pathname + window.location.search)
        return <Navigate to="/login" replace />
    }

    if (!secured && isAuthenticated) return <Navigate to={consumePostLoginRedirect() ?? '/dashboard'} replace />
    if (secured && permission && !allowed) return <Navigate to="/dashboard" replace />
    if (secured && user && user.consentedAt === null) return <ConsentGate />

    return <>{children}</>
}

export default AuthGuard
