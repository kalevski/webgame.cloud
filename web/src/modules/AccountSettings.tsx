import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import { useTc } from '@toolcase/web-components/react'
import FloatingActionBar from 'components/FloatingActionBar'
import { MODAL, useModalOpen } from 'modals'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { apiUrl } from 'helpers/api'
import { OAuthProvider, OAUTH_PROVIDERS, OAUTH_PROVIDER_LABELS } from 'types'
import { formatDate } from 'helpers/dates'

type ValueElement = HTMLElement & { value?: string }

const isProvider = (key: string): key is OAuthProvider =>
    (OAUTH_PROVIDERS as readonly string[]).includes(key)

const PROVIDER_ICONS: Record<OAuthProvider, string> = {
    google: 'Globe',
    discord: 'MessageCircle',
}

const PROVIDER_BRAND_COLORS: Record<OAuthProvider, string> = {
    google: '#4285F4',
    discord: '#5865F2',
}

const AccountSettings: React.FC = () => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const p = t.profile
    const me = useStore((state) => state.me)
    const updateName = useStore((state) => state.updateName)
    const sessionRoleName = useStore((state) => state.roleName)
    const exportAccount = useStore((state) => state.exportAccount)
    const deleteAccount = useStore((state) => state.deleteAccount)
    const authConfig = useStore((state) => state.authConfig)
    const identities = useStore((state) => state.identities)
    const fetchIdentities = useStore((state) => state.fetchIdentities)
    const unlinkIdentity = useStore((state) => state.unlinkIdentity)
    const addAlert = useStore((state) => state.addAlert)

    const { isOwner } = useAuth()

    useEffect(() => {
        void fetchIdentities()
    }, [fetchIdentities])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const linked = params.get('linked')
        const linkError = params.get('link_error')
        if (!linked && !linkError) return
        if (linked && isProvider(linked)) {
            trackEvent(EVENT.ACCOUNT_LINK, { provider: linked })
            addAlert({
                variant: 'success',
                message: t.alerts.identityLinked(OAUTH_PROVIDER_LABELS[linked]),
                dismissible: true,
            })
            void fetchIdentities()
        } else if (linkError) {
            addAlert({
                variant: 'danger',
                message: linkError === 'identity_linked_elsewhere'
                    ? t.errors.identity_linked_elsewhere
                    : t.alerts.identityLinkFailed,
                dismissible: true,
            })
        }
        window.history.replaceState(null, '', window.location.pathname)
    }, [addAlert, fetchIdentities, t])

    const [name, setName] = useState(me?.name ?? '')
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: me?.name ?? '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })

    const roleName = sessionRoleName ?? me?.role ?? ''

    const profileCard = useTc<HTMLElement>({
        meta: me ? [
            { label: p.emailLabel, value: me.email },
            { label: p.roleLabel, value: roleName },
            { label: p.joinedLabel, value: formatDate(me.createdAt) },
            { label: p.statusLabel, value: me.active ? p.statusActive : p.statusInactive },
        ] : [],
    })
    const chipRow = useTc<HTMLElement>({
        badges: me
            ? [
                  { label: p.roleLabel, value: roleName, variant: 'secondary' },
                  ...(me.verified ? [{ label: p.verifiedBadge, variant: 'success' }] : []),
              ]
            : [],
    })

    const openDeleteModal = useModalOpen<boolean, void>(MODAL.DELETE_ACCOUNT, (confirmed) => {
        if (!confirmed) return
        trackEvent(EVENT.ACCOUNT_DELETE, {})
        deleteAccount()
    })

    const dangerZone = useTc<HTMLElement>({
        actions: [
            {
                key: 'delete',
                title: t.account.deleteTitle,
                description: isOwner ? t.account.deleteOwnerBlocked : t.account.deleteDescription,
                buttonLabel: t.account.deleteAction,
                icon: 'Trash2',
                disabled: isOwner,
            },
        ],
        onactionclick: (key: string) => {
            if (key === 'delete' && !isOwner) openDeleteModal()
        },
    })

    const legalLinks = useTc<HTMLElement>({
        actions: [
            { key: 'privacy', title: t.account.legalPrivacy, icon: 'FileText' },
            { key: 'terms', title: t.account.legalTerms, icon: 'FileText' },
        ],
        onActionClick: (key: string) => navigate(key === 'privacy' ? '/privacy' : '/terms'),
    })

    const connectionProviders = useMemo<OAuthProvider[]>(() => {
        const configured = authConfig?.providers ?? []
        const linked = identities.map((identity) => identity.provider)
        return [...new Set([...configured, ...linked])]
    }, [authConfig, identities])

    const connections = useTc<HTMLElement>({
        providers: connectionProviders.map((provider) => {
            const identity = identities.find((entry) => entry.provider === provider)
            return {
                key: provider,
                label: OAUTH_PROVIDER_LABELS[provider],
                connected: Boolean(identity),
                account: identity ? identity.email : p.notConnected,
                icon: PROVIDER_ICONS[provider],
            }
        }),
        brandColors: PROVIDER_BRAND_COLORS,
        onToggle: (key: string, connected: boolean) => {
            if (!isProvider(key)) return
            if (!connected) {
                window.location.href = apiUrl(`/api/auth/${key}?link=1`)
                return
            }
            if (identities.length <= 1) {
                addAlert({ variant: 'danger', message: t.errors.last_identity, dismissible: true })
                return
            }
            trackEvent(EVENT.ACCOUNT_UNLINK, { provider: key })
            void unlinkIdentity(key)
        },
    })

    if (!me) return null

    const dirty = name.trim().length > 0 && name.trim() !== me.name

    const handleSave = async () => {
        if (!dirty || saving) return
        setSaving(true)
        try {
            await updateName(name.trim())
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="module-profile__columns">

            <div className="module-profile__identity">
                <tc-entity-profile-card ref={profileCard} title={me.name || me.email} className="module-profile__card">
                    <tc-avatar slot="lead" name={me.name || me.email} size="lg"></tc-avatar>
                    <tc-badge-row slot="chips" ref={chipRow} size="sm"></tc-badge-row>
                </tc-entity-profile-card>

                <tc-panel bordered className="module-profile__form">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-form-input ref={nameInput} type="text" label={p.nameLabel}></tc-form-input>
                        <tc-helper-text icon="Info">{p.nameHint}</tc-helper-text>
                    </tc-stack>
                </tc-panel>

                <FloatingActionBar label={p.unsavedHint} visible={dirty}>
                    <tc-button key="save" variant="primary" disabled={saving || undefined} onClick={handleSave}>
                        {p.save}
                    </tc-button>
                </FloatingActionBar>
            </div>

            <div className="module-profile__account">
                {connectionProviders.length > 0 && (
                    <tc-stack direction="column" gap="0.5rem" className="module-profile__section">
                        <tc-linked-providers-card
                            ref={connections}
                            title={p.connectionsTitle}
                            empty-label={p.notConnected}
                        ></tc-linked-providers-card>
                        <tc-text variant="muted">{p.connectionsIntro}</tc-text>
                    </tc-stack>
                )}

                <tc-section-card title={t.account.exportTitle} className="module-profile__section">
                    <tc-stack direction="column" gap="0.85rem" align="start">
                        <tc-text variant="muted">{t.account.exportDescription}</tc-text>
                        <tc-button
                            variant="secondary"
                            outline
                            onClick={() => {
                                trackEvent(EVENT.ACCOUNT_EXPORT, {})
                                exportAccount()
                            }}
                        >
                            {t.account.exportAction}
                        </tc-button>
                    </tc-stack>
                </tc-section-card>

                <tc-danger-zone-actions ref={dangerZone} className="module-profile__danger-zone"></tc-danger-zone-actions>

                <tc-section-card title={t.account.legalTitle} className="module-profile__section">
                    <tc-action-row-list ref={legalLinks} outline></tc-action-row-list>
                </tc-section-card>
            </div>
        </div>
    )
}

export default AccountSettings
