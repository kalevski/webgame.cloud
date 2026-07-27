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
import ProfilePage from 'pages/ProfilePage'
import ProjectsPage from 'pages/ProjectsPage'
import ProjectDetailPage from 'pages/ProjectDetailPage'

const AdminPage = lazy(() => import('pages/AdminPage'))
const ModerationPage = lazy(() => import('pages/ModerationPage'))
const InvoicesPage = lazy(() => import('pages/InvoicesPage'))
const EnquiriesPage = lazy(() => import('pages/EnquiriesPage'))
const BillingPage = lazy(() => import('pages/BillingPage'))
const EmailPage = lazy(() => import('pages/EmailPage'))
const PublicInvoicePage = lazy(() => import('pages/PublicInvoicePage'))

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
        <tc-theme name="default">
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
                                    <Route path="/projects" element={<ProjectsPage />} />
                                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                                    <Route path="/projects/:id/:tab" element={<ProjectDetailPage />} />
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
