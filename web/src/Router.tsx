import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router'
import { ModalContext, ModalRender } from 'modals'
import { PageProvider } from 'contexts/PageContext'
import Init from 'modules/Init'
import Loading from 'components/Loading'
import ErrorBoundary from 'components/ErrorBoundary'
import { trackPageView } from 'helpers/analytics'
import LandingPage from 'pages/LandingPage'
import DashboardPage from 'pages/DashboardPage'
import LoginPage from 'pages/LoginPage'
import PrivacyPage from 'pages/PrivacyPage'
import TermsPage from 'pages/TermsPage'
import DmcaPage from 'pages/DmcaPage'
import ProfilePage from 'pages/ProfilePage'
import ActiveProjectRedirect from 'modules/ActiveProjectRedirect'
import AssetsPage from 'pages/AssetsPage'
import BundlesPage from 'pages/BundlesPage'
import BuildsPage from 'pages/BuildsPage'
import ConfigsPage from 'pages/ConfigsPage'
import MembersPage from 'pages/MembersPage'
import ProjectSettingsPage from 'pages/ProjectSettingsPage'
import RealmsAdminPage from 'pages/RealmsAdminPage'

const AdminPage = lazy(() => import('pages/AdminPage'))
const ModerationPage = lazy(() => import('pages/ModerationPage'))
const InvoicesPage = lazy(() => import('pages/InvoicesPage'))
const EnquiriesPage = lazy(() => import('pages/EnquiriesPage'))
const BillingPage = lazy(() => import('pages/BillingPage'))
const EmailPage = lazy(() => import('pages/EmailPage'))
const PublicInvoicePage = lazy(() => import('pages/PublicInvoicePage'))
const PlatformProjectsPage = lazy(() => import('pages/PlatformProjectsPage'))
const PlatformUsersPage = lazy(() => import('pages/PlatformUsersPage'))
const CreateProjectPage = lazy(() => import('pages/CreateProjectPage'))
const LiveBuildsPage = lazy(() => import('pages/LiveBuildsPage'))
const ToolsFontsPage = lazy(() => import('pages/ToolsFontsPage'))
const ToolsNormalMapsPage = lazy(() => import('pages/ToolsNormalMapsPage'))
const ToolsPhysicsPage = lazy(() => import('pages/ToolsPhysicsPage'))
const ToolsTranslationsPage = lazy(() => import('pages/ToolsTranslationsPage'))

const ScrollRestore = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        document.querySelector('.tc-dashboard-layout__content')?.scrollTo(0, 0)
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

const RouteErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    return (
        <ErrorBoundary resetKey={pathname} onBack={() => navigate(-1)}>
            {children}
        </ErrorBoundary>
    )
}

const TrackPageViews = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        trackPageView(pathname)
    }, [pathname])
    return null
}

export const Router = () => {
    return (
        <tc-theme name="blueprint" variant="sunset">
            <ModalContext>
                <BrowserRouter>
                    <Init />
                    <ScrollRestore />
                    <TrackPageViews />
                    <PageProvider>
                        <RouteErrorBoundary>
                            <Suspense fallback={<Loading />}>
                                <Routes>

                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/dashboard" element={<DashboardPage />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/privacy" element={<PrivacyPage />} />
                                    <Route path="/terms" element={<TermsPage />} />
                                    <Route path="/dmca" element={<DmcaPage />} />
                                    <Route path="/projects" element={<ActiveProjectRedirect />} />
                                    <Route path="/projects/new" element={<CreateProjectPage />} />
                                    <Route path="/projects/:id" element={<AssetsPage />} />
                                    <Route path="/projects/:id/assets" element={<AssetsPage />} />
                                    <Route path="/projects/:id/bundles" element={<BundlesPage />} />
                                    <Route path="/projects/:id/builds" element={<BuildsPage />} />
                                    <Route path="/projects/:id/live" element={<LiveBuildsPage />} />
                                    <Route path="/projects/:id/live/:buildId" element={<LiveBuildsPage />} />
                                    <Route path="/projects/:id/tools/live-config" element={<ConfigsPage />} />
                                    <Route path="/projects/:id/tools/fonts" element={<ToolsFontsPage />} />
                                    <Route path="/projects/:id/tools/normal-maps" element={<ToolsNormalMapsPage />} />
                                    <Route path="/projects/:id/tools/physics" element={<ToolsPhysicsPage />} />
                                    <Route path="/projects/:id/tools/translations" element={<ToolsTranslationsPage />} />
                                    <Route path="/projects/:id/members" element={<MembersPage />} />
                                    <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
                                    <Route path="/projects/:id/settings/:tab" element={<ProjectSettingsPage />} />
                                    <Route path="/platform/realms" element={<RealmsAdminPage />} />
                                    <Route path="/platform/realms/regions" element={<RealmsAdminPage />} />
                                    <Route path="/platform/realms/:id" element={<RealmsAdminPage />} />
                                    <Route path="/admin/realms" element={<Navigate to="/platform/realms" replace />} />
                                    <Route path="/platform/projects" element={<PlatformProjectsPage />} />
                                    <Route path="/platform/projects/:id" element={<PlatformProjectsPage />} />
                                    <Route path="/platform/projects/:id/:tab" element={<PlatformProjectsPage />} />
                                    <Route path="/platform/users" element={<PlatformUsersPage />} />
                                    <Route path="/platform/users/:id" element={<PlatformUsersPage />} />
                                    <Route path="/platform/users/:id/:tab" element={<PlatformUsersPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/profile/billing" element={<Navigate to="/billing" replace />} />
                                    <Route path="/profile/:tab" element={<ProfilePage />} />
                                    <Route path="/billing" element={<BillingPage />} />
                                    <Route path="/billing/:tab" element={<BillingPage />} />
                                    <Route path="/admin" element={<AdminPage />} />
                                    <Route path="/admin/:tab" element={<AdminPage />} />
                                    <Route path="/platform/invoices" element={<InvoicesPage />} />
                                    <Route path="/platform/enquiries" element={<EnquiriesPage />} />
                                    <Route path="/platform/email" element={<EmailPage />} />
                                    <Route path="/platform/email/:tab" element={<EmailPage />} />
                                    <Route path="/invoice/:token" element={<PublicInvoicePage />} />
                                    <Route path="/moderation" element={<ModerationPage />} />
                                    <Route path="/moderation/:tab" element={<ModerationPage />} />

                                    <Route path="/users" element={<Navigate to="/admin" replace />} />
                                    <Route path="/account" element={<Navigate to="/profile" replace />} />
                                    <Route path="/invites" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/invites/:id" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Suspense>
                        </RouteErrorBoundary>
                    </PageProvider>
                    <ModalRender />
                </BrowserRouter>
            </ModalContext>
        </tc-theme>
    )
}
