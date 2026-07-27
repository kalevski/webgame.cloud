import React, { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import useCan from 'hooks/useCan'
import RouteTabs from 'components/RouteTabs'
import AuthGuard from 'modules/AuthGuard'
import EmailOutbox from 'modules/EmailOutbox'
import EmailTemplatesAdmin from 'modules/EmailTemplatesAdmin'
import EmailTriggersAdmin from 'modules/EmailTriggersAdmin'
import EmailSettingsPanel from 'modules/EmailSettingsPanel'

type EmailTab = 'outbox' | 'templates' | 'triggers' | 'settings'

const EmailPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const emailEnabled = useFeature('email')
    const canConfigure = useCan('email.config.write')
    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'outbox', label: t.email.tabOutbox, icon: 'inbox', path: '/platform/email' },
        { id: 'templates', label: t.email.tabTemplates, icon: 'mail', path: '/platform/email/templates' },
        { id: 'triggers', label: t.email.tabTriggers, icon: 'zap', path: '/platform/email/triggers' },
        ...(canConfigure
            ? [{ id: 'settings', label: t.email.tabSettings, icon: 'settings', path: '/platform/email/settings' }]
            : []),
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'outbox') as EmailTab

    useEffect(() => {
        setPageTitle(t.pages.emailTitle)
        setPageDescription(t.pages.emailDescription)
    }, [setPageTitle, setPageDescription, t.pages.emailTitle, t.pages.emailDescription])

    if (!emailEnabled) return <Navigate to="/dashboard" replace />

    return (
        <AuthGuard secured permission="email.outbox.read">
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="module module-email">
                            <RouteTabs tabs={tabs} activeId={tab} />

                            <div className="module-email__content">
                                {tab === 'outbox' && <EmailOutbox />}
                                {tab === 'templates' && <EmailTemplatesAdmin />}
                                {tab === 'triggers' && <EmailTriggersAdmin />}
                                {tab === 'settings' && <EmailSettingsPanel />}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(EmailPage)
