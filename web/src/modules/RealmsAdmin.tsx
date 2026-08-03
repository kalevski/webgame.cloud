import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'
import { AppStrings } from 'configs/strings'
import { Realm, RealmHealth, RealmStatus } from 'types'

const HEALTH_DOT: Record<RealmHealth, 'online' | 'offline' | 'busy' | 'away'> = {
    healthy: 'online',
    degraded: 'away',
    unhealthy: 'busy',
    unknown: 'offline',
}

const STATUS_BADGE: Record<RealmStatus, 'success' | 'warning' | 'secondary'> = {
    active: 'success',
    draining: 'warning',
    offline: 'secondary',
}

const percentOf = (part: number, whole: number): number =>
    whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0

const barVariant = (percent: number): 'success' | 'warning' | 'danger' => {
    if (percent >= 85) return 'danger'
    if (percent >= 60) return 'warning'
    return 'success'
}

const barsFor = (realm: Realm, r: AppStrings['realms']) => [
    {
        key: 'storage',
        label: r.cardStorage,
        percent: percentOf(realm.storageUsedBytes, realm.storageUsedBytes + realm.diskFreeBytes),
        detail: r.cardBarDetail(
            formatBytes(realm.storageUsedBytes),
            formatBytes(realm.storageUsedBytes + realm.diskFreeBytes)
        ),
    },
    {
        key: 'memory',
        label: r.cardMemoryPeak,
        percent: percentOf(realm.peakMemoryUsedBytes, realm.memoryTotalBytes),
        detail: r.cardBarDetail(
            formatBytes(realm.peakMemoryUsedBytes),
            formatBytes(realm.memoryTotalBytes)
        ),
    },
    {
        key: 'cpu',
        label: r.cardCpuPeak,
        percent: realm.peakCpuUsage,
        detail: r.cardBarPercent(realm.peakCpuUsage),
    },
]

const RealmsAdmin: React.FC = () => {
    const { t } = useStrings()
    const r = t.realms
    const navigate = useNavigate()

    const realms = useStore((state) => state.realms)
    const realmsLoaded = useStore((state) => state.realmsLoaded)
    const fetchRealms = useStore((state) => state.fetchRealms)
    const plans = useStore((state) => state.plans)
    const billingLoaded = useStore((state) => state.billingLoaded)
    const fetchBilling = useStore((state) => state.fetchBilling)

    useEffect(() => {
        void fetchRealms()
    }, [fetchRealms])

    useEffect(() => {
        if (!billingLoaded) void fetchBilling()
    }, [billingLoaded, fetchBilling])

    const healthLabels: Record<RealmHealth, string> = {
        healthy: r.healthHealthy,
        degraded: r.healthDegraded,
        unhealthy: r.healthUnhealthy,
        unknown: r.healthUnknown,
    }
    const statusLabels: Record<RealmStatus, string> = {
        active: r.statusActive,
        draining: r.statusDraining,
        offline: r.statusOffline,
    }

    return (
        <div className="module module-realms">
            <tc-text variant="muted">{r.intro}</tc-text>

            {realmsLoaded && realms.length === 0 && (
                <tc-empty-state icon="server">{r.empty}</tc-empty-state>
            )}
            {realms.length > 0 && (
                <div className="module-realms__grid">
                    {realms.map((realm) => (
                        <a
                            key={realm.id}
                            className="module-realms__card"
                            href={`/platform/realms/${realm.id}`}
                            onClick={(event) => {
                                event.preventDefault()
                                navigate(`/platform/realms/${realm.id}`)
                            }}
                        >
                            <header className="module-realms__card-head">
                                <tc-status-dot
                                    status={HEALTH_DOT[realm.health]}
                                    pulse={(realm.health === 'healthy') || undefined}
                                ></tc-status-dot>
                                <h3 className="module-realms__card-name">{realm.name}</h3>
                                <tc-badge
                                    variant={STATUS_BADGE[realm.status]}
                                    text={statusLabels[realm.status]}
                                ></tc-badge>
                                {realm.exclusive && (
                                    <tc-badge variant="secondary" text={r.exclusiveLabel}></tc-badge>
                                )}
                            </header>

                            <div className="module-realms__card-url">{realm.baseUrl}</div>
                            <div className="module-realms__card-meta">
                                {realm.regionName || '—'} · {plans.find((plan) => plan.id === realm.planId)?.name ?? r.anyPlan}
                            </div>

                            <div className="module-realms__card-bars">
                                {barsFor(realm, r).map((bar) => (
                                    <div key={bar.key} className="module-realms__card-bar">
                                        <div className="module-realms__card-bar-head">
                                            <span>{bar.label}</span>
                                            <span>{bar.detail}</span>
                                        </div>
                                        <tc-progress
                                            value={bar.percent}
                                            variant={barVariant(bar.percent)}
                                        ></tc-progress>
                                    </div>
                                ))}
                            </div>

                            <dl className="module-realms__card-stats">
                                <div>
                                    <dt>{r.healthLabel}</dt>
                                    <dd>{healthLabels[realm.health]}</dd>
                                </div>
                                <div>
                                    <dt>{r.projectCount}</dt>
                                    <dd>{realm.projectCount}</dd>
                                </div>
                                <div>
                                    <dt>{r.diskFree}</dt>
                                    <dd>{formatBytes(realm.diskFreeBytes)}</dd>
                                </div>
                                <div>
                                    <dt>{r.queueDepth}</dt>
                                    <dd>{realm.queueDepth}</dd>
                                </div>
                                <div className="module-realms__card-stat-wide">
                                    <dt>{r.lastSeen}</dt>
                                    <dd>{formatDateTime(realm.lastSeenAt, r.never)}</dd>
                                </div>
                            </dl>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RealmsAdmin
