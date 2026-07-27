import React from 'react'
import { usePageContext } from 'contexts/PageContext'

const PageHeader: React.FC = () => {
    const { pageTitle, pageDescription } = usePageContext()

    return (
        <div className="module module-page-header">

            <h1 className="module-page-header__title">{pageTitle}</h1>
            {pageDescription && <span className="module-page-header__description">{pageDescription}</span>}
        </div>
    )
}

export default PageHeader
