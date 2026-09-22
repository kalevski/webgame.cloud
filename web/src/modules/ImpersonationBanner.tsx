import React from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'

const ImpersonationBanner: React.FC = () => {
    const { t } = useStrings()
    const me = useStore((state) => state.me)
    const impersonatedBy = useStore((state) => state.impersonatedBy)
    const endImpersonation = useStore((state) => state.endImpersonation)

    if (!impersonatedBy || !me) return null

    const admin = impersonatedBy.name || impersonatedBy.email
    const target = me.name || me.email

    return (
        <tc-banner variant="warning" icon="user-check" className="module-impersonation-banner" role="status">
            <strong>{t.impersonation.title}</strong> {t.impersonation.body(target, admin)}
            <tc-button
                variant="secondary"
                size="sm"
                outline
                onClick={() => { void endImpersonation() }}
            >
                {t.impersonation.end}
            </tc-button>
        </tc-banner>
    )
}

export default ImpersonationBanner
