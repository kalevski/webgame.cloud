import { inject, injectable } from 'tsyringe'
import type { FeatureFlag, FeatureFlags } from '../contracts/index.js'
import { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS, FEATURE_FLAG_REQUIRES } from '../contracts/index.js'
import { dropSlot, fromSlot, slot } from '../domain/cache.js'
import { SettingsService } from './SettingsService.js'

const CACHE_TTL_MS = 10_000

const flagKey = (flag: FeatureFlag): string => `feature_${flag}`

const FLAG_KEYS = FEATURE_FLAGS.map(flagKey)

@injectable()
export class FeatureService {
    constructor(@inject(SettingsService) private settings: SettingsService) {}

    private cache = slot<FeatureFlags>()

    async getFlags(): Promise<FeatureFlags> {
        return fromSlot(this.cache, CACHE_TTL_MS, async () => {
            const stored = await this.storedFlags()
            return Object.fromEntries(
                FEATURE_FLAGS.map((flag) => {
                    const requires = FEATURE_FLAG_REQUIRES[flag]
                    return [flag, requires ? stored[flag] && stored[requires] : stored[flag]]
                })
            ) as FeatureFlags
        })
    }

    async isEnabled(flag: FeatureFlag): Promise<boolean> {
        return (await this.getFlags())[flag]
    }

    async storedFlags(): Promise<FeatureFlags> {
        const values = await this.settings.getRawMany(FLAG_KEYS)
        return Object.fromEntries(
            FEATURE_FLAGS.map((flag) => {
                const raw = values.get(flagKey(flag))
                return [flag, raw === undefined ? FEATURE_FLAG_DEFAULTS[flag] : raw === 'true']
            })
        ) as FeatureFlags
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
        dropSlot(this.cache)
    }
}
