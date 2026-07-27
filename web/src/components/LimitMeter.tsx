import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import { LimitableResource } from 'types'
import { EVENT } from 'configs/analytics'
import { trackOnce } from 'helpers/analytics'

type LimitMeterProps = {
    used: number

    limit: number | null

    onUpgrade?: () => void

    noun: string

    resource: LimitableResource
}

const LimitMeter: React.FC<LimitMeterProps> = ({ used, limit, onUpgrade, noun, resource }) => {
    const { t } = useStrings()
    const reached = limit !== null && used >= limit

    useEffect(() => {
        if (!reached) return
        trackOnce(`limit:${resource}`, EVENT.LIMIT_REACHED, { resource, limit: limit ?? 0 })
    }, [reached, resource, limit])

    if (limit === null) return null

    const nearing = !reached && used >= limit - 1
    const variant = reached ? 'danger' : nearing ? 'warning' : 'secondary'

    return (
        <span className="limit-meter">
            <tc-badge variant={variant} text={`${used}/${limit} ${noun}`}></tc-badge>
            {reached && onUpgrade && (
                <tc-button size="small" variant="warning" onClick={onUpgrade}>
                    {t.upgrade.cta}
                </tc-button>
            )}

            {reached && !onUpgrade && <span className="limit-meter__hint">{t.limits.reachedHint}</span>}
        </span>
    )
}

export default LimitMeter
