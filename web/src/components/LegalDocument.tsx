import React from 'react'
import { useNavigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import useStrings from 'hooks/useStrings'
import AppBrand from 'modules/AppBrand'

type LegalDocumentProps = {
    title: string
    updated: string
    children: React.ReactNode
}

const LegalDocument: React.FC<LegalDocumentProps> = ({ title, updated, children }) => {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { t } = useStrings()

    return (
        <div className="module module-legal">
            <header className="module-legal__header">
                <AppBrand />
                <button
                    type="button"
                    className="module-legal__back"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                >
                    {t.common.legalBack}
                </button>
            </header>
            <article className="module-legal__doc">
                <h1 className="module-legal__title">{title}</h1>
                <p className="module-legal__updated">{t.common.legalUpdated(updated)}</p>
                {children}
            </article>
        </div>
    )
}

export default LegalDocument
