import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import { formatMoney } from 'helpers/money'
import { useStore } from 'state'
import { useTc } from '@toolcase/web-components/react'
import AppBrand from 'modules/AppBrand'
import { PERMISSIONS, Plan, SEED_ROLES } from 'types'

const formatPrice = (plan: Plan): string =>
    plan.priceCents === 0 ? '' : formatMoney(plan.priceCents, plan.currency)

const PublicPlanCard: React.FC<{ plan: Plan; actionLabel: string; onSelect: () => void }> = ({
    plan,
    actionLabel,
    onSelect,
}) => {
    const { t } = useStrings()
    const b = t.billing

    const card = useTc<HTMLElement>({
        features: plan.features.length > 0 ? plan.features : [plan.description].filter(Boolean),
        action: { label: actionLabel, variant: 'primary', onClick: onSelect },
    })

    return (
        <tc-pricing-card
            ref={card}
            name={plan.name}
            price={formatPrice(plan) || b.freePrice}
            period={plan.priceCents === 0 ? undefined : plan.interval === 'year' ? b.perYear : b.perMonth}
            description={plan.description || undefined}
            badge-text={plan.mode === 'manual' ? b.modeManual : undefined}
        ></tc-pricing-card>
    )
}

const Landing: React.FC = () => {
    const { t } = useStrings()
    const l = t.landing
    const { isAuthenticated } = useAuth()
    const publicConstants = useStore((state) => state.publicConstants)
    const fetchPublicConstants = useStore((state) => state.fetchPublicConstants)

    useEffect(() => {
        void fetchPublicConstants()
    }, [fetchPublicConstants])

    const plans = publicConstants?.features.billing ? publicConstants.plans : []

    const entryPath = isAuthenticated ? '/dashboard' : '/login'
    const entryLabel = isAuthenticated ? l.ctaDashboard : l.ctaPrimary
    const enterApp = () => window.location.assign(entryPath)

    const hero = useTc<HTMLElement>({
        metrics: [
            { label: l.metricPermissions, value: String(PERMISSIONS.length) },
            { label: l.metricRoles, value: String(SEED_ROLES.length) },
            { label: l.metricCommands, value: '3' },
        ],
        primaryAction: { label: entryLabel, icon: 'ArrowRight' },
        secondaryAction: { label: l.ctaSecondary },
        onPrimaryAction: enterApp,
        onSecondaryAction: () =>
            document.querySelector('.module-landing__features')?.scrollIntoView({ behavior: 'smooth' }),
        bgIcons: ['KeyRound', 'ToggleRight', 'Bell', 'FolderKanban'],
    })

    const terminal = useTc<HTMLElement>({ lines: l.terminal })
    const pipeline = useTc<HTMLElement>({ steps: l.stack })
    const quickStart = useTc<HTMLElement>({ steps: l.quickStart })
    const faq = useTc<HTMLElement>({ items: l.faq })

    const footer = useTc<HTMLElement>({
        menus: [
            {
                title: l.footerProduct,
                links: [
                    {
                        label: isAuthenticated ? l.footerDashboard : l.footerSignIn,
                        href: entryPath,
                    },
                ],
            },
            {
                title: l.footerLegal,
                links: [
                    { label: t.pages.privacyTitle, href: '/privacy' },
                    { label: t.pages.termsTitle, href: '/terms' },
                ],
            },
        ],
        cta: {
            label: l.footerCta,
            href: entryPath,
            heading: l.footerCtaHeading,
            description: l.footerCtaDescription,
        },
    })

    return (
        <div className="module module-landing">
            <header className="module-landing__nav">
                <AppBrand />
                <tc-button variant="primary" onClick={enterApp}>
                    {entryLabel}
                </tc-button>
            </header>

            <tc-hero
                ref={hero}
                eyebrow={l.eyebrow}
                title={l.heroTitle}
                title-as="h1"
                description={l.heroDescription}
                note={l.heroNote}
            ></tc-hero>

            <div className="module-landing__terminal">
                <tc-terminal-window
                    ref={terminal}
                    animate-typing
                    prompt="~/appkit $"
                ></tc-terminal-window>
            </div>

            <section className="module-landing__band module-landing__features">
                <div className="module-landing__inner">
                    <h2 className="module-landing__section-title">{l.featuresTitle}</h2>
                    <p className="module-landing__section-intro">{l.featuresIntro}</p>
                    <tc-grid columns={1} columns-md={3} gap="1.5rem">
                        {l.features.map((feature) => (
                            <tc-feature-card
                                key={feature.title}
                                icon={feature.icon}
                                eyebrow={feature.eyebrow}
                                title={feature.title}
                                description={feature.description}
                            ></tc-feature-card>
                        ))}
                    </tc-grid>
                </div>
            </section>

            {plans.length > 0 && (
                <section className="module-landing__band module-landing__pricing">
                    <div className="module-landing__inner">
                        <h2 className="module-landing__section-title">{l.pricingTitle}</h2>
                        <p className="module-landing__section-intro">{l.pricingIntro}</p>
                        <div className="module-landing__plans">
                            {plans.map((plan) => (
                                <PublicPlanCard
                                    key={plan.id}
                                    plan={plan}
                                    actionLabel={plan.mode === 'manual' ? l.pricingContact : l.pricingStart}
                                    onSelect={enterApp}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="module-landing__band module-landing__band--tint">
                <div className="module-landing__inner">
                    <h2 className="module-landing__section-title">{l.stackTitle}</h2>
                    <p className="module-landing__section-intro">{l.stackIntro}</p>
                    <tc-pipeline ref={pipeline}></tc-pipeline>
                    <div className="module-landing__chain">
                        <tc-code-snippet
                            code={l.stackChain}
                            language="bash"
                            show-copy-button="false"
                        ></tc-code-snippet>
                    </div>
                </div>
            </section>

            <section className="module-landing__band">
                <div className="module-landing__inner module-landing__inner--narrow">
                    <h2 className="module-landing__section-title">{l.quickStartTitle}</h2>
                    <p className="module-landing__section-intro">{l.quickStartIntro}</p>
                    <tc-quick-start ref={quickStart}></tc-quick-start>
                </div>
            </section>

            <section className="module-landing__band module-landing__band--tint">
                <div className="module-landing__inner module-landing__inner--narrow">
                    <h2 className="module-landing__section-title">{l.faqTitle}</h2>
                    <tc-faq-list ref={faq}></tc-faq-list>
                </div>
            </section>

            <tc-page-footer
                ref={footer}
                brand="AppKit"
                tagline={l.footerTagline}
                description={l.footerDescription}
                legal-text={l.legalText}
            ></tc-page-footer>
        </div>
    )
}

export default Landing
