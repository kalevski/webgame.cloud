export const DEMO_SCALES = [
    'small',   // one of everything, enough to look at a screen
    'medium',  // enough for paging, filters and a busy queue to be real
    'large',   // the volume performance work measures against
] as const

export type DemoScale = typeof DEMO_SCALES[number]

export const DEMO_SEED = 'webgame'

export type DemoRequest = {
    scale?: DemoScale

    seed?: string

    force?: boolean
}

export type DemoResult = {
    scale: DemoScale
    seed: string

    accounts: string[]

    created: Record<string, number>

    suppressedDispatches: number

    tookMs: number
}
