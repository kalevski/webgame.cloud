import React, { useEffect } from 'react'
import { useLocation, useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'
import RouteTabs from 'components/RouteTabs'
import AuthGuard from 'modules/AuthGuard'
import RealmsAdmin from 'modules/RealmsAdmin'
import RealmRegionsAdmin from 'modules/RealmRegionsAdmin'
import RealmDetail from 'modules/RealmDetail'
import { Realm, RealmRegion } from 'types'

const REGIONS_PATH = '/platform/realms/regions'

const RealmsAdminPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { id } = useParams()
    const { pathname } = useLocation()

    const onRegions = pathname === REGIONS_PATH

    const canWrite = useCan('realm.write')
    const fetchRealms = useStore((state) => state.fetchRealms)
    const realm = useStore((state) => state.realmDetail)
    const fetchRealmDetail = useStore((state) => state.fetchRealmDetail)

    const openEditor = useModalOpen<boolean, Realm | undefined>(MODAL.REALM_EDITOR, (saved) => {
        if (!saved) return
        if (id) void fetchRealmDetail(id)
        else void fetchRealms()
    })
    const openRegion = useModalOpen<boolean, RealmRegion | undefined>(MODAL.REALM_REGION)

    const tabs = [
        { id: 'realms', label: t.realms.tabRealms, icon: 'server', path: '/platform/realms' },
        { id: 'regions', label: t.realms.tabRegions, icon: 'globe', path: REGIONS_PATH },
    ]

    useEffect(() => {
        setPageTitle(t.pages.realmsTitle)
        setPageDescription(t.pages.realmsDescription)
    }, [setPageTitle, setPageDescription, t.pages.realmsTitle, t.pages.realmsDescription])

    return (
        <AuthGuard secured permission="realm.read">
            <section className="console-page">
                <tc-rich-page-header
                    title-text={t.pages.realmsTitle}
                    description={t.pages.realmsDescription}
                    icon-name="Server"
                    icon-color="cyan"
                >
                    <span slot="actions">
                        {canWrite && !id && !onRegions && (
                            <tc-button variant="primary" onClick={() => openEditor(undefined)}>
                                <span>{t.realms.add}</span>
                            </tc-button>
                        )}
                        {canWrite && onRegions && (
                            <tc-button variant="primary" onClick={() => openRegion(undefined)}>
                                <span>{t.realms.regionAdd}</span>
                            </tc-button>
                        )}
                        {canWrite && id && realm && (
                            <tc-button variant="primary" onClick={() => openEditor(realm)}>
                                <span>{t.realms.edit}</span>
                            </tc-button>
                        )}
                    </span>
                </tc-rich-page-header>

                {!id && <RouteTabs tabs={tabs} activeId={onRegions ? 'regions' : 'realms'} />}

                {id ? <RealmDetail /> : onRegions ? <RealmRegionsAdmin /> : <RealmsAdmin />}
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(RealmsAdminPage)
