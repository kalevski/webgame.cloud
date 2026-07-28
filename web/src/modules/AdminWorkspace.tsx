import React from 'react'
import { useParams } from 'react-router'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import useFeature from 'hooks/useFeature'
import RouteTabs from 'components/RouteTabs'
import AdminOverview from 'modules/AdminOverview'
import UsersAdmin from 'modules/UsersAdmin'
import PlatformSettingsPanel from 'modules/PlatformSettingsPanel'
import FeatureFlagsPanel from 'modules/FeatureFlagsPanel'
import AccessPolicyAdmin from 'modules/AccessPolicyAdmin'
import ApiKeysAdmin from 'modules/ApiKeysAdmin'
import WebhooksAdmin from 'modules/WebhooksAdmin'
import FilesAdmin from 'modules/FilesAdmin'
import RetentionAdmin from 'modules/RetentionAdmin'
import JobsAdmin from 'modules/JobsAdmin'
import SigningKeysAdmin from 'modules/SigningKeysAdmin'

type AdminTab =
    | 'overview'
    | 'users'
    | 'access'
    | 'settings'
    | 'api-keys'
    | 'webhooks'
    | 'files'
    | 'jobs'
    | 'retention'
    | 'signing-keys'

const AdminWorkspace: React.FC = () => {
    const { t } = useStrings()

    const { tab: tabParam } = useParams()

    const canReadOverview = useCan('admin.overview.read')
    const canReadUsers = useCan('admin.user.read')
    const canReadRoles = useCan('admin.role.read')
    const canReadSettings = useCan('admin.settings.read')
    const canReadWebhooks = useCan('webhook.read')
    const canReadAssetSources = useCan('file.source.read')
    const canReadJobs = useCan('job.read')
    const canReadSigningKeys = useCan('signing.key.read')
    const filesEnabled = useFeature('files')

    const tabs = [
        ...(canReadOverview ? [{ id: 'overview', label: t.admin.tabOverview, icon: 'gauge', path: '/admin/overview' }] : []),
        ...(canReadUsers ? [{ id: 'users', label: t.admin.tabUsers, icon: 'shield', path: '/admin/users' }] : []),

        ...(canReadRoles ? [{ id: 'access', label: t.accessAdmin.tab, icon: 'lock', path: '/admin/access' }] : []),
        ...(canReadSettings ? [{ id: 'settings', label: t.admin.tabSettings, icon: 'settings', path: '/admin/settings' }] : []),
        { id: 'api-keys', label: t.apiKeys.tab, icon: 'key', path: '/admin/api-keys' },
        ...(canReadWebhooks ? [{ id: 'webhooks', label: t.webhooks.tab, icon: 'webhook', path: '/admin/webhooks' }] : []),
        ...(filesEnabled && canReadAssetSources ? [{ id: 'files', label: t.files.tab, icon: 'database', path: '/admin/files' }] : []),
        ...(canReadJobs ? [{ id: 'jobs', label: t.jobs.tab, icon: 'calendar-clock', path: '/admin/jobs' }] : []),
        ...(canReadSettings ? [{ id: 'retention', label: t.retention.tab, icon: 'timer', path: '/admin/retention' }] : []),
        ...(canReadSigningKeys ? [{ id: 'signing-keys', label: t.signingKeys.tab, icon: 'key-round', path: '/admin/signing-keys' }] : []),
    ]

    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : available[0]) as AdminTab | undefined

    return (
        <div className="module module-workspace">
            <tc-rich-page-header
                className="module-workspace__header"
                title-text={t.pages.adminTitle}
                description={t.pages.adminDescription}
                icon-name="ShieldCheck"
                icon-color="blue"
            ></tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={tab ?? ''} />
            <div className="module-workspace__content">
                {tab === 'overview' && <AdminOverview />}
                {tab === 'users' && <UsersAdmin />}
                {tab === 'access' && <AccessPolicyAdmin />}
                {tab === 'api-keys' && <ApiKeysAdmin />}
                {tab === 'webhooks' && <WebhooksAdmin />}
                {tab === 'files' && <FilesAdmin />}
                {tab === 'jobs' && <JobsAdmin />}
                {tab === 'retention' && <RetentionAdmin />}
                {tab === 'signing-keys' && <SigningKeysAdmin />}
                {tab === 'settings' && (
                    <div className="module-workspace__sections">
                        <PlatformSettingsPanel />
                        <FeatureFlagsPanel />
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminWorkspace
