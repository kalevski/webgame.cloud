import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import Profile from 'modules/Profile'

const ProfilePage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.profileTitle)
        setPageDescription(t.pages.profileDescription)
    }, [setPageTitle, setPageDescription, t.pages.profileTitle, t.pages.profileDescription])

    return (
        <AuthGuard secured>
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <Profile />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ProfilePage)
