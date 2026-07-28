import { useCallback } from 'react'
import useStrings from 'hooks/useStrings'
import { formatDate } from 'helpers/dates'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const useWhen = () => {
    const { t } = useStrings()

    return useCallback(
        (iso: string | null, now: number = Date.now()): string => {
            if (!iso) return ''

            const at = new Date(iso).getTime()
            if (!Number.isFinite(at)) return ''

            const elapsed = Math.max(0, now - at)
            if (elapsed < MINUTE) return t.notifications.justNow
            if (elapsed < HOUR) return t.notifications.minutesAgo(Math.floor(elapsed / MINUTE))
            if (elapsed < DAY) return t.notifications.hoursAgo(Math.floor(elapsed / HOUR))
            if (elapsed < 7 * DAY) return t.notifications.daysAgo(Math.floor(elapsed / DAY))

            return formatDate(iso)
        },
        [t]
    )
}

export default useWhen
