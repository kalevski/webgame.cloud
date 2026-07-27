export const EVENT = {
    LOGIN: 'login',

    SIGN_UP: 'sign_up',
    LOGOUT: 'logout',
    CONSENT_ACCEPT: 'consent_accept',
    ACCOUNT_EXPORT: 'account_export',
    ACCOUNT_DELETE: 'account_delete',
    ACCOUNT_LINK: 'account_link',
    ACCOUNT_UNLINK: 'account_unlink',
    SESSION_REVOKE: 'session_revoke',
    PUSH_ENABLE: 'push_enable',

    PROJECT_CREATE: 'project_create',
    PROJECT_DELETE: 'project_delete',
    PROJECT_EXPORT: 'project_export',
    TASK_ADD: 'task_add',

    REPORT_SUBMIT: 'report_submit',
    MODERATION_RESOLVE: 'moderation_resolve',

    PAYWALL_VIEW: 'paywall_view',

    PAYWALL_CLICK: 'paywall_click',
    UPGRADE_MODAL_VIEW: 'upgrade_modal_view',
    LIMIT_REACHED: 'limit_reached',

    API_ERROR: 'api_error',
} as const

export type AnalyticsEvent = (typeof EVENT)[keyof typeof EVENT]

export type PaywallSurface = 'nudge' | 'action'
