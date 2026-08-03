import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import UserDirectory from 'modules/UserDirectory'
import UserProfileAdmin from 'modules/UserProfileAdmin'

const PlatformUsersPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { id } = useParams()

    useEffect(() => {
        setPageTitle(t.pages.platformUsersTitle)
        setPageDescription(t.pages.platformUsersDescription)
    }, [setPageTitle, setPageDescription, t.pages.platformUsersTitle, t.pages.platformUsersDescription])

    return (
        <AuthGuard secured permission="admin.user.read">
            <section className="console-page">
                {!id && (
                    <tc-rich-page-header
                        title-text={t.pages.platformUsersTitle}
                        description={t.pages.platformUsersDescription}
                        icon-name="UsersRound"
                        icon-color="blue"
                    ></tc-rich-page-header>
                )}

                {id ? <UserProfileAdmin /> : <UserDirectory />}
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(PlatformUsersPage)
