import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'
import { Realm, RealmHealth, RealmRegion } from 'types'

const RealmRegionsAdmin: React.FC = () => {
    const { t } = useStrings()
    const r = t.realms
    const navigate = useNavigate()

    const regions = useStore((state) => state.realmRegions)
    const regionsLoaded = useStore((state) => state.realmRegionsLoaded)
    const fetchRegions = useStore((state) => state.fetchRealmRegions)
    const updateRegion = useStore((state) => state.updateRealmRegion)
    const deleteRegion = useStore((state) => state.deleteRealmRegion)
    const realms = useStore((state) => state.realms)
    const fetchRealms = useStore((state) => state.fetchRealms)

    const canWrite = useCan('realm.write')

    const openEditor = useModalOpen<boolean, RealmRegion | undefined>(MODAL.REALM_REGION)
    const openDelete = useModalOpen<RealmRegion, RealmRegion>(MODAL.DELETE_REALM_REGION, (confirmed) => {
        if (confirmed) void deleteRegion(confirmed.id)
    })

    useEffect(() => {
        void fetchRegions()
        void fetchRealms()
    }, [fetchRegions, fetchRealms])

    const hosted = useMemo(() => {
        const map = new Map<string, Realm[]>()
        for (const realm of realms) {
            if (!realm.regionId) continue
            const list = map.get(realm.regionId)
            if (list) list.push(realm)
            else map.set(realm.regionId, [realm])
        }
        return map
    }, [realms])

    const healthLabels: Record<RealmHealth, string> = {
        healthy: r.healthHealthy,
        degraded: r.healthDegraded,
        unhealthy: r.healthUnhealthy,
        unknown: r.healthUnknown,
    }

    return (
        <div className="module module-realm-regions">
            <tc-text variant="muted">{r.regionsIntro}</tc-text>

            {regionsLoaded && regions.length === 0 && (
                <tc-empty-state icon="globe">{r.regionsEmpty}</tc-empty-state>
            )}

            {regions.length > 0 && (
                <div className="module-realm-regions__grid">
                    {regions.map((region) => {
                        const machines = hosted.get(region.id) ?? []
                        const blocked = region.realmCount > 0

                        return (
                            <article
                                key={region.id}
                                className="module-realm-regions__card"
                                data-open={region.active}
                            >
                                <header className="module-realm-regions__head">
                                    <h3 className="module-realm-regions__name">{region.name}</h3>
                                    <tc-badge
                                        variant={region.active ? 'success' : 'secondary'}
                                        text={region.active ? r.regionActiveBadge : r.regionInactiveBadge}
                                    ></tc-badge>
                                </header>

                                <p className="module-realm-regions__state">
                                    {region.active ? r.regionOpenHint : r.regionClosedHint}
                                </p>

                                <div className="module-realm-regions__occupancy">
                                    <span className="module-realm-regions__legend">
                                        {r.regionRealmCount(region.realmCount)}
                                    </span>

                                    {region.realmCount === 0 ? (
                                        <p className="module-realm-regions__vacant">{r.regionNoRealms}</p>
                                    ) : (
                                        <ul className="module-realm-regions__realms">
                                            {machines.map((realm) => (
                                                <li key={realm.id}>
                                                    <button
                                                        type="button"
                                                        className="module-realm-regions__realm"
                                                        data-health={realm.health}
                                                        title={healthLabels[realm.health]}
                                                        onClick={() => navigate(`/platform/realms/${realm.id}`)}
                                                    >
                                                        <span
                                                            className="module-realm-regions__dot"
                                                            aria-hidden="true"
                                                        />
                                                        {realm.name}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {canWrite && (
                                    <footer className="module-realm-regions__actions">
                                        <tc-button
                                            variant="secondary"
                                            size="sm"
                                            outline
                                            onClick={() => void updateRegion(region.id, { active: !region.active })}
                                        >
                                            <span>{region.active ? r.regionDeactivate : r.regionActivate}</span>
                                        </tc-button>
                                        <tc-button
                                            variant="secondary"
                                            size="sm"
                                            outline
                                            onClick={() => openEditor(region)}
                                        >
                                            <span>{r.regionEdit}</span>
                                        </tc-button>
                                        <tc-button
                                            variant="danger"
                                            size="sm"
                                            outline
                                            disabled={blocked || undefined}
                                            title={blocked ? r.regionDeleteBlocked(region.realmCount) : undefined}
                                            onClick={() => openDelete(region)}
                                        >
                                            <span>{t.projects.delete}</span>
                                        </tc-button>
                                    </footer>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default RealmRegionsAdmin
