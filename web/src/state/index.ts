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
            ...createUsersSlice(...args),
        }),
        { name: 'store' }
    )
)
