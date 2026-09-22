import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useNavigation from 'hooks/useNavigation'
import useStrings from 'hooks/useStrings'
import AppBar from 'modules/AppBar'
import AlertPanel from 'modules/AlertPanel'
import ImpersonationBanner from 'modules/ImpersonationBanner'
import MoreSheet from 'modules/MoreSheet'
import NavDock from 'modules/NavDock'
import OfflineBanner from 'modules/OfflineBanner'
import PageTabs from 'components/PageTabs'
import { chromeForPath } from 'configs/navigation'

const AppFrame: React.FC = () => {
    const { pathname } = useLocation()
    const { t } = useStrings()
    const { pageTitle, pageDescription, pageTabs, registerChromeHost } = usePageContext()
    const { activeTabId, backOrRoot } = useNavigation()
    const [moreOpen, setMoreOpen] = useState(false)
    const shell = useRef<HTMLElement>(null)

    const chrome = chromeForPath(pathname)

    const overlayHost = useCallback(
        (element: HTMLDivElement | null) => registerChromeHost('overlay', element),
        [registerChromeHost]
    )

    useEffect(() => {
        setMoreOpen(false)
    }, [pathname])

    return (
        <tc-mobile-shell ref={shell} className="app-frame" data-key={pathname} desktop={true} edge="both">
            <a className="app-frame__skip" href="#main-content">{t.common.skipToContent}</a>

            <AppBar variant={chrome.bar} title={pageTitle} subtitle={pageDescription} onBack={backOrRoot}>
                {pageTabs.length > 0 && (
                    <div slot="below" className="app-frame__tabs">
                        <PageTabs tabs={pageTabs} />
                    </div>
                )}
            </AppBar>

            <div slot="header" className="app-frame__strips">
                <ImpersonationBanner />
                <OfflineBanner />
            </div>

            <div className="app-frame__pane">
                <main id="main-content" className="app-frame__content">
                    <AlertPanel />
                    <Outlet />
                </main>
            </div>

            <div slot="overlay">
                <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
                <div className="app-frame__overlay-host" ref={overlayHost} />
            </div>

            <NavDock activeId={activeTabId} onMore={() => setMoreOpen(true)} />
        </tc-mobile-shell>
    )
}

export default AppFrame
