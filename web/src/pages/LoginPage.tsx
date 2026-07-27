import React, { useEffect } from 'react'
import { wrapInBaseLayout } from 'layouts/BaseLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import LoginPanel from 'modules/LoginPanel'

const LoginPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.auth.title)
        setPageDescription(t.auth.subtitle)
    }, [setPageTitle, setPageDescription, t.auth.title, t.auth.subtitle])

    return (
        <AuthGuard>
            <LoginPanel />
        </AuthGuard>
    )
}

export default wrapInBaseLayout(LoginPage)
