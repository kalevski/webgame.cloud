export type WorkerHealth = {
    name: string

    lastTickAt: string | null

    healthy: boolean
}

export type ReadyReport = {
    ready: boolean

    database: boolean

    migration: number | null

    workers: WorkerHealth[]
}

export type VersionInfo = {
    name: string
    version: string

    build: string

    startedAt: string
}
