import { inject, injectable } from 'tsyringe'
import type { PlatformSettings } from '../contracts/index.js'
import { SettingsRepository } from '../repositories/settings/SettingsRepository.js'

const KEY = {
    signupsOpen: 'signups_open',
    announcement: 'announcement',
    salesContact: 'sales_contact',
    pushVapidKeys: 'push_vapid_keys',
} as const

@injectable()
export class SettingsService {
    constructor(@inject(SettingsRepository) private settings: SettingsRepository) {}

    async getRaw(key: string): Promise<string | undefined> {
        const value = await this.settings.get(key)
        return value === '' ? undefined : value
    }

    async getRawByPrefix(prefix: string): Promise<Map<string, string>> {
        return this.settings.getByPrefix(prefix)
    }

    async setRaw(key: string, value: string): Promise<void> {
        await this.settings.set(key, value)
    }

    async getPlatformSettings(): Promise<PlatformSettings> {
        const [signupsOpen, announcement, salesContact] = await Promise.all([
            this.settings.get(KEY.signupsOpen),
            this.settings.get(KEY.announcement),
            this.settings.get(KEY.salesContact),
        ])
        return {
            signupsOpen: signupsOpen !== 'false',
            announcement: announcement ?? '',
            salesContact: salesContact ?? '',
        }
    }

    async savePlatformSettings(next: PlatformSettings): Promise<PlatformSettings> {
        await this.settings.set(KEY.signupsOpen, String(next.signupsOpen))
        await this.settings.set(KEY.announcement, next.announcement.trim())
        await this.settings.set(KEY.salesContact, next.salesContact.trim())
        return this.getPlatformSettings()
    }

    async getSignupsOpen(): Promise<boolean> {
        return (await this.settings.get(KEY.signupsOpen)) !== 'false'
    }

    async getPushVapidKeys(): Promise<{ publicKey: string; privateKey: string } | null | 'corrupt'> {
        const raw = await this.settings.get(KEY.pushVapidKeys)
        if (raw === undefined) return null
        try {
            const parsed = JSON.parse(raw) as { publicKey?: string; privateKey?: string }
            if (parsed.publicKey && parsed.privateKey) {
                return { publicKey: parsed.publicKey, privateKey: parsed.privateKey }
            }
        } catch {
        }
        return 'corrupt'
    }

    async savePushVapidKeys(
        keys: { publicKey: string; privateKey: string },

        overwrite = false
    ): Promise<void> {
        const value = JSON.stringify(keys)
        if (overwrite) {
            await this.settings.set(KEY.pushVapidKeys, value)
            return
        }
        await this.settings.setIfAbsent(KEY.pushVapidKeys, value)
    }
}
