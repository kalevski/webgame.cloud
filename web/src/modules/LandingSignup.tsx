import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import EarlyAccessPanel from 'components/EarlyAccessPanel'
import WaitlistService from 'services/WaitlistService'
import { WAITLIST_CONSENT_VERSION } from 'types'

const LandingSignup: React.FC = () => {
    const { t } = useStrings()
    const [total, setTotal] = useState(0)

    useEffect(() => {
        void WaitlistService.getInstance().stats().then((stats) => setTotal(stats.total))
    }, [])

    const reserve = async (email: string, marketingOptIn: boolean, website: string): Promise<boolean> => {
        try {
            await WaitlistService.getInstance().signup({
                email,
                marketingOptIn,
                consentVersion: WAITLIST_CONSENT_VERSION,
                source: 'landing',
                website,
            })
            return true
        } catch {
            return false
        }
    }

    return (
        <section id="early-access" className="py-5 py-md-7 bg-light">
            <tc-container>
                <EarlyAccessPanel copy={t.waitlist} reservedCount={total} onReserve={reserve} />
            </tc-container>
        </section>
    )
}

export default LandingSignup
