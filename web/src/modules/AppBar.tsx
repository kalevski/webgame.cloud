import React from 'react'
import useStrings from 'hooks/useStrings'
import AppBrand from 'modules/AppBrand'
import NotificationsBell from 'modules/NotificationsBell'
import CommandPalette from 'modules/CommandPalette'
import UsageSummary from 'modules/UsageSummary'
import type { ChromeBar } from 'configs/navigation'

type AppBarProps = {
    variant: ChromeBar
    title: string
    subtitle: string
    headingLevel?: '1' | '2' | '3' | '4' | '5' | '6'
    onBack: () => void
    children?: React.ReactNode
}

const AppBar: React.FC<AppBarProps> = ({ variant, title, subtitle, headingLevel, onBack, children }) => {
    const { t } = useStrings()

    if (variant === 'none') return null

    return (
        <tc-app-bar
            slot="header"
            className="app-bar"
            variant={variant}
            heading={title}
            subheading={subtitle}
            back-label={t.common.back}
            heading-level={headingLevel}
            truncate
            ontc-app-bar-back={onBack}
        >
            {variant === 'brand' && (
                <div slot="brand" className="app-bar__brand">
                    <AppBrand />
                </div>
            )}

            <div slot="actions" className="app-bar__actions">
                <CommandPalette />
                <UsageSummary />
                <NotificationsBell />
            </div>

            {children}
        </tc-app-bar>
    )
}

export default AppBar
