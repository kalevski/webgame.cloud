export type AdminStatsRow = {
    signups_total: string
    signups_last_30: string
    wau: string
    cohort_size: string
    cohort_active: string
    projects_total: string
    projects_last_30: string
    builds_total: string
}

export type SignupWeekRow = {
    week: string
    count: string
}

export type UserRoleCountRow = {
    role: string
    name: string
    count: string
}

export type ProjectAppTypeCountRow = {
    app_type: string
    count: string
}

export type BuildStatusCountRow = {
    status: string
    count: string
}
