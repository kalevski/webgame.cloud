import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { ApiKey } from 'types'
import { formatDate, formatDateTime } from 'helpers/dates'

const describe = (key: ApiKey, labels: {
    scopeCount: (n: number) => string
    lastUsed: (when: string) => string
    neverUsed: string
    expires: (when: string) => string
    neverExpires: string
}): string => [
    key.prefix,
    labels.scopeCount(key.scopes.length),
    key.lastUsedAt ? labels.lastUsed(formatDateTime(key.lastUsedAt)) : labels.neverUsed,
    key.expiresAt ? labels.expires(formatDate(key.expiresAt)) : labels.neverExpires,
].join(' · ')

const ApiKeysAdmin: React.FC = () => {
    const { t } = useStrings()
    const k = t.apiKeys
    const apiKeys = useStore((state) => state.apiKeys)
    const apiKeysLoaded = useStore((state) => state.apiKeysLoaded)
    const fetchApiKeys = useStore((state) => state.fetchApiKeys)
    const revokeApiKey = useStore((state) => state.revokeApiKey)

    const openApiKey = useModalOpen<{ keyId: string } | null, void>(MODAL.API_KEY)

    useEffect(() => {
        void fetchApiKeys()
    }, [fetchApiKeys])

    const list = useTc<HTMLElement>({
        actions: apiKeys.map((key) => ({
            key: key.id,
            title: key.name,
            description: describe(key, k),
            label: k.revoke,
            variant: 'danger',
            icon: 'Trash2',
        })),
        onActionClick: (id: string) => {
            const key = apiKeys.find((entry) => entry.id === id)
            if (!key) return
            if (!window.confirm(k.revokePrompt(key.name))) return
            void revokeApiKey(id)
        },
    })

    return (
        <div className="module module-api-keys">
            <tc-section-card title={k.title} icon="Key">
                <tc-button slot="action" variant="primary" onClick={() => openApiKey()}>
                    {k.create}
                </tc-button>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{k.intro}</tc-text>

                    {apiKeysLoaded && apiKeys.length === 0 && (
                        <tc-empty-state icon="key">{k.empty}</tc-empty-state>
                    )}

                    {apiKeys.length > 0 && (
                        <tc-action-row-list ref={list} outline trailing-icon="none"></tc-action-row-list>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default ApiKeysAdmin
