export const FEATURE_FLAGS = [
    'billing',
    'email',
    'magic_link',
    'files',
    'tickets',
    'designs',
] as const

export type FeatureFlag = typeof FEATURE_FLAGS[number]

export type FeatureFlags = Record<FeatureFlag, boolean>

export const FEATURE_FLAG_DEFAULTS: FeatureFlags = {
    billing: false,
    email: false,
    magic_link: false,
    files: false,
    tickets: false,
    designs: false,
}

export const FEATURE_FLAG_REQUIRES: Partial<Record<FeatureFlag, FeatureFlag>> = {
    magic_link: 'email',
}
