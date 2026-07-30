import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import useTcEvent from 'hooks/useTcEvent'
import { useStore } from 'state'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { Realm, RealmToken } from 'types'

const RealmsAdmin: React.FC = () => {
    const { t } = useStrings()
    const r = t.realms

    const realms = useStore((state) => state.realms)
    const realmsLoaded = useStore((state) => state.realmsLoaded)
    const fetchRealms = useStore((state) => state.fetchRealms)
    const deleteRealm = useStore((state) => state.deleteRealm)
    const rotateRealmToken = useStore((state) => state.rotateRealmToken)

    const canWrite = useCan('realm.write')

    useEffect(() => {
        void fetchRealms()
    }, [fetchRealms])

    const showToken = useModalOpen<null, RealmToken>(MODAL.REALM_TOKEN)
    const openEditor = useModalOpen<RealmToken | boolean, Realm | undefined>(MODAL.REALM_EDITOR, (result) => {
        void fetchRealms()
        if (result && typeof result === 'object' && 'token' in result) showToken(result)
    })

    const list = useTc<HTMLElement>({
        actions: realms.map((realm) => ({
            key: realm.id,
            title: `${realm.name} — ${realm.health}`,
            description: `${realm.baseUrl} · ${realm.region || '—'} · ${realm.projectCount} projects · ${
                realm.exclusive ? 'exclusive' : 'shared'
            }`,
            label: canWrite ? r.edit : '',
            variant: 'secondary',
            icon: canWrite ? 'Pencil' : '',
        })),
    })

    useTcEvent<{ key: string }>(list, 'tc-action-click', ({ key }) => {
        const realm = realms.find((entry) => entry.id === key)
        if (realm) openEditor(realm)
    })

    const maintenance = useTc<HTMLElement>({
        actions: realms.flatMap((realm) => [
            {
                key: `rotate:${realm.id}`,
                title: `${r.rotateToken} — ${realm.name}`,
                description: r.rotateHint,
                buttonLabel: r.rotateToken,
                icon: 'KeyRound',
            },
            {
                key: `delete:${realm.id}`,
                title: `${r.deleteTitle} — ${realm.name}`,
                description: realm.projectCount > 0 ? r.deleteBlocked(realm.projectCount) : r.deleteHint,
                buttonLabel: r.deleteTitle,
                icon: 'Trash2',
                disabled: realm.projectCount > 0,
            },
        ]),
        onactionclick: (key: string) => {
            const [verb, id] = key.split(':')
            if (verb === 'delete') {
                void deleteRealm(id)
                return
            }
            void rotateRealmToken(id).then((issued) => {
                if (issued) showToken(issued)
            })
        },
    })

    return (
        <div className="module module-realms">
            <tc-section-card title={r.title} icon="Server">
                <span slot="action" className="section-card-actions">
                    {canWrite && (
                        <tc-button variant="primary" onClick={() => openEditor(undefined)}>
                            {r.add}
                        </tc-button>
                    )}
                </span>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{r.intro}</tc-text>

                    {realmsLoaded && realms.length === 0 && (
                        <tc-empty-state icon="server">{r.empty}</tc-empty-state>
                    )}
                    {realms.length > 0 && (
                        <tc-action-row-list ref={list} outline trailing-icon="none"></tc-action-row-list>
                    )}
                </tc-stack>
            </tc-section-card>

            {canWrite && realms.length > 0 && (
                <tc-section-card title={r.maintenanceTitle} icon="KeyRound" className="module-realms__maintenance">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-text variant="muted">{r.maintenanceIntro}</tc-text>
                        <tc-danger-zone-actions ref={maintenance}></tc-danger-zone-actions>
                    </tc-stack>
                </tc-section-card>
            )}
        </div>
    )
}

export default RealmsAdmin
