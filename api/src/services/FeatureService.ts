import { inject, injectable } from 'tsyringe'
import type { FeatureFlag, FeatureFlags } from '../contracts/index.js'
import { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS, FEATURE_FLAG_REQUIRES } from '../contracts/index.js'
import { SettingsService } from './SettingsService.js'

const CACHE_TTL_MS = 10_000

const flagKey = (flag: FeatureFlag): string => `feature_${flag}`

@injectable()
export class FeatureService {
    constructor(@inject(SettingsService) private settings: SettingsService) {}

    private cache: { value: FeatureFlags; expiresAt: number } | null = null

    async getFlags(): Promise<FeatureFlags> {
        if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.value

        const entries = await Promise.all(
            FEATURE_FLAGS.map(async (flag) => {
                const raw = await this.settings.getRaw(flagKey(flag))
                return [flag, raw === undefined ? FEATURE_FLAG_DEFAULTS[flag] : raw === 'true'] as const
            })
        )
        const stored = Object.fromEntries(entries) as FeatureFlags
        const value = Object.fromEntries(
            FEATURE_FLAGS.map((flag) => {
                const requires = FEATURE_FLAG_REQUIRES[flag]
                return [flag, requires ? stored[flag] && stored[requires] : stored[flag]]
            })
        ) as FeatureFlags

        this.cache = { value, expiresAt: Date.now() + CACHE_TTL_MS }
        return value
    }

    async isEnabled(flag: FeatureFlag): Promise<boolean> {
        return (await this.getFlags())[flag]
    }

    async storedFlags(): Promise<FeatureFlags> {
        const entries = await Promise.all(
            FEATURE_FLAGS.map(async (flag) => {
                const raw = await this.settings.getRaw(flagKey(flag))
                return [flag, raw === undefined ? FEATURE_FLAG_DEFAULTS[flag] : raw === 'true'] as const
            })
        )
        return Object.fromEntries(entries) as FeatureFlags
    }

    async saveFlags(next: Partial<FeatureFlags>): Promise<FeatureFlags> {
        for (const flag of FEATURE_FLAGS) {
            const value = next[flag]
            if (value === undefined) continue

            const requires = FEATURE_FLAG_REQUIRES[flag]
            if (value && requires) {
                const stored = await this.storedFlags()
                const prerequisiteOn = next[requires] ?? stored[requires]
                if (!prerequisiteOn) continue
            }

            await this.settings.setRaw(flagKey(flag), String(value))
        }
        this.invalidate()
        return this.getFlags()
    }

    invalidate(): void {
        this.cache = null
    }
}
