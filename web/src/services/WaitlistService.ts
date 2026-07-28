import { apiFetch } from 'helpers/api'
import { WaitlistSignupDraft, WaitlistStats } from 'types'

class WaitlistService {
    private static instance: WaitlistService
    private constructor() {}

    static getInstance(): WaitlistService {
        if (!WaitlistService.instance) WaitlistService.instance = new WaitlistService()
        return WaitlistService.instance
    }

    async signup(draft: WaitlistSignupDraft): Promise<void> {
        await fetch('/api/public/waitlist', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(draft),
        })
    }

    async stats(): Promise<WaitlistStats> {
        const response = await fetch('/api/public/waitlist/stats')
        if (!response.ok) return { total: 0, claimed: 0 }
        return await response.json() as WaitlistStats
    }
}

export default WaitlistService
