import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import Moderation from 'modules/Moderation'

const ModerationPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.moderationTitle)
        setPageDescription(t.pages.moderationDescription)
    }, [setPageTitle, setPageDescription, t.pages.moderationTitle, t.pages.moderationDescription])

    return (
        <AuthGuard secured permission="moderation.queue.read">
            <section className="console-page">
                <Moderation />
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ModerationPage)
