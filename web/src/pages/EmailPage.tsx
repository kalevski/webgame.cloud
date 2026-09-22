import React, { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import useCan from 'hooks/useCan'
import usePageTabs from 'hooks/usePageTabs'
import { HOME_ROUTE } from 'configs/navigation'
import AuthGuard from 'modules/AuthGuard'
import EmailOutbox from 'modules/EmailOutbox'
import EmailTemplatesAdmin from 'modules/EmailTemplatesAdmin'
import EmailTriggersAdmin from 'modules/EmailTriggersAdmin'
import EmailSettingsPanel from 'modules/EmailSettingsPanel'

type EmailTab = 'outbox' | 'templates' | 'triggers' | 'settings'

const EmailPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const emailEnabled = useFeatureGate('email')
    const canConfigure = useCan('email.config.write')
    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'outbox', label: t.email.tabOutbox, href: '/platform/email' },
        { id: 'templates', label: t.email.tabTemplates, href: '/platform/email/templates' },
        { id: 'triggers', label: t.email.tabTriggers, href: '/platform/email/triggers' },
        ...(canConfigure
            ? [{ id: 'settings', label: t.email.tabSettings, href: '/platform/email/settings' }]
            : []),
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'outbox') as EmailTab

    usePageTabs(tabs)

    useEffect(() => {
        setPageTitle(t.pages.emailTitle)
        setPageDescription(t.pages.emailDescription)
    }, [setPageTitle, setPageDescription, t.pages.emailTitle, t.pages.emailDescription])

    if (emailEnabled === null) return null
    if (!emailEnabled) return <Navigate to={HOME_ROUTE} replace />

    return (
        <AuthGuard secured permission="email.outbox.read">
            <div className="module module-email">
                {tab === 'outbox' && <EmailOutbox />}
                {tab === 'templates' && <EmailTemplatesAdmin />}
                {tab === 'triggers' && <EmailTriggersAdmin />}
                {tab === 'settings' && <EmailSettingsPanel />}
            </div>
        </AuthGuard>
    )
}

export default EmailPage
