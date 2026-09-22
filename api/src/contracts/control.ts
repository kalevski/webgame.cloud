import type { Alarm, HealthComponent, WorkerHealth } from './health.js'

export type ControlStatus = {
    name: string
    version: string

    build: string

    startedAt: string

    ready: boolean

    components: HealthComponent[]

    alarms: Alarm[]

    workers: WorkerHealth[]
}

export type ControlRunRequest = {
    kinds?: string[]
}

export type ControlRunResult = {
    triggered: string[]
}
