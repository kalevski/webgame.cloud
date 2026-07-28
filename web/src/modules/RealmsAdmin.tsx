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

    const header = useTc<HTMLElement>({
        actions: canWrite ? [{ key: 'new', label: r.add, icon: 'Plus', variant: 'primary' }] : [],
        onExec: (key: string) => {
            if (key === 'new') openEditor(undefined)
        },
    })

    useEffect(() => {
        const content = header.current?.querySelector('.tc-action-header-content')
        if (content) content.textContent = r.title
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

    return (
        <div className="module module-realms">
            <tc-action-header ref={header} className="module-realms__action-header"></tc-action-header>

            <tc-section-card title={r.title}>
                <tc-stack direction="column" gap="0.85rem">
                    {realmsLoaded && realms.length === 0 && (
                        <tc-empty-state icon="server">{r.empty}</tc-empty-state>
                    )}
                    {realms.length > 0 && (
                        <tc-action-row-list ref={list} outline trailing-icon="none"></tc-action-row-list>
                    )}
                    {canWrite && realms.length > 0 && (
                        <tc-stack direction="row" gap="0.5rem" wrap>
                            {realms.map((realm) => (
                                <tc-button
                                    key={`rotate-${realm.id}`}
                                    variant="secondary"
                                    outline
                                    onClick={async () => {
                                        const issued = await rotateRealmToken(realm.id)
                                        if (issued) showToken(issued)
                                    }}
                                >
                                    {r.rotateToken}: {realm.name}
                                </tc-button>
                            ))}
                            {realms.map((realm) => (
                                <tc-button
                                    key={`delete-${realm.id}`}
                                    variant="danger"
                                    outline
                                    onClick={() => void deleteRealm(realm.id)}
                                >
                                    {r.deleteTitle}: {realm.name}
                                </tc-button>
                            ))}
                        </tc-stack>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default RealmsAdmin
