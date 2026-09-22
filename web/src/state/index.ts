import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createAccessPolicySlice, AccessPolicySlice } from './accessPolicy.slice'
import { createAlertsSlice, AlertsSlice } from './alerts.slice'
import { createAuthSlice, AuthSlice } from './auth.slice'
import { createBillingSlice, BillingSlice } from './billing.slice'
import { createEmailSlice, EmailSlice } from './email.slice'
import { createModerationSlice, ModerationSlice } from './moderation.slice'
import { createNotificationsSlice, NotificationsSlice } from './notifications.slice'
import { createPlatformSlice, PlatformSlice } from './platform.slice'
import { createProjectsSlice, ProjectsSlice } from './projects.slice'
import { createRealmsSlice, RealmsSlice } from './realms.slice'
import { createAssetsSlice, AssetsSlice } from './assets.slice'
import { createBundlesSlice, BundlesSlice } from './bundles.slice'
import { createBuildsSlice, BuildsSlice } from './builds.slice'
import { createConfigsSlice, ConfigsSlice } from './configs.slice'
import { createTranslationsSlice, TranslationsSlice } from './translations.slice'
import { createRoleApplicationsSlice, RoleApplicationsSlice } from './roleApplications.slice'
import { createServiceAccountsSlice, ServiceAccountsSlice } from './serviceAccounts.slice'
import { createTicketsSlice, TicketsSlice } from './tickets.slice'
import { createUsersSlice, UsersSlice } from './users.slice'

export type AppStore = AccessPolicySlice &
    AlertsSlice &
    AuthSlice &
    BillingSlice &
    EmailSlice &
    ModerationSlice &
    NotificationsSlice &
    PlatformSlice &
    ProjectsSlice &
    RealmsSlice &
    AssetsSlice &
    BundlesSlice &
    BuildsSlice &
    ConfigsSlice &
    TranslationsSlice &
    RoleApplicationsSlice &
    ServiceAccountsSlice &
    TicketsSlice &
    UsersSlice

export const useStore = create<AppStore>()(
    devtools(
        (...args) => ({
            ...createAlertsSlice(...args),
            ...createAuthSlice(...args),
            ...createAccessPolicySlice(...args),
            ...createBillingSlice(...args),
            ...createEmailSlice(...args),
            ...createModerationSlice(...args),
            ...createNotificationsSlice(...args),
            ...createPlatformSlice(...args),
            ...createProjectsSlice(...args),
            ...createRealmsSlice(...args),
            ...createAssetsSlice(...args),
            ...createBundlesSlice(...args),
            ...createBuildsSlice(...args),
            ...createConfigsSlice(...args),
            ...createTranslationsSlice(...args),
            ...createRoleApplicationsSlice(...args),
            ...createServiceAccountsSlice(...args),
            ...createTicketsSlice(...args),
            ...createUsersSlice(...args),
        }),
        { name: 'store' }
    )
)
