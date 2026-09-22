import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import { formatMoney } from 'helpers/money'
import { useStore } from 'state'
import { useTc } from '@toolcase/web-components/react'
import { TcTabSections } from 'lib/tc'
import LandingSignup from 'modules/LandingSignup'
import LandingMetrics from 'components/LandingMetrics'
import EngineCards from 'components/EngineCards'
import { Plan } from 'types'

type Stage = { eyebrow: string; title: string; description: string }
type AssetLine = { icon: string; name: string; size: string; tags: readonly string[] }
type PipelineStep = { title: string; sub: string }
type ConfigLine = { key: string; value: string; live: boolean }
type TeamLine = { name: string; email: string; role: string }
type HowTab = {
    key: string
    label: string
    icon: string
    assets: readonly AssetLine[]
    bundleName: string
    bundleMeta: string
    chips: readonly string[]
    pipeline: readonly PipelineStep[]
    config: readonly ConfigLine[]
    team: readonly TeamLine[]
    stages: readonly Stage[]
}

const CDN_NODES = [
    { top: '28%', left: '18%', variant: 'primary' },
    { top: '22%', left: '46%', variant: 'accent' },
    { top: '34%', left: '62%', variant: 'primary' },
    { top: '44%', left: '78%', variant: 'primary' },
    { top: '58%', left: '36%', variant: 'accent' },
    { top: '52%', left: '70%', variant: 'primary' },
]

const HERO_ICONS = ['FileJson', 'FileMusic', 'File', 'Gamepad2', 'Joystick', 'Image', 'Server']

const formatPrice = (plan: Plan): string =>
    plan.priceCents === 0 ? '' : formatMoney(plan.priceCents, plan.currency)

const scrollTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const AssetLineRow: React.FC<{ line: AssetLine }> = ({ line }) => {
    const row = useTc<HTMLElement>({ tags: [...line.tags] })
    return <tc-asset-row ref={row} icon={line.icon} name={line.name} size={line.size}></tc-asset-row>
}

const AssetLines: React.FC<{ lines: readonly AssetLine[] }> = ({ lines }) => (
    <tc-asset-row-list>
        {lines.map((line) => (
            <AssetLineRow key={line.name} line={line} />
        ))}
    </tc-asset-row-list>
)

const SectionHead: React.FC<{ eyebrow: string; title: string; lead: string }> = ({ eyebrow, title, lead }) => (
    <div className="text-center mb-5">
        <p className="landing-eyebrow mb-2">{eyebrow}</p>
        <h2 className="display-6 fw-semibold mb-3">{title}</h2>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 720 }}>
            {lead}
        </p>
    </div>
)

const StageCard: React.FC<{ stage: Stage; children?: React.ReactNode }> = ({ stage, children }) => (
    <tc-feature-card
        className="w-100 h-100"
        size="full"
        eyebrow={stage.eyebrow}
        title={stage.title}
        description={stage.description}
    >
        <div slot="visual">{children}</div>
    </tc-feature-card>
)

const HowPanel: React.FC<{ tab: HowTab }> = ({ tab }) => {
    const bundle = useTc<HTMLElement>({ chips: tab.chips.map((label) => ({ label })) })
    const pipeline = useTc<HTMLElement>({
        steps: tab.pipeline.map((step, index) => ({
            title: step.title,
            state: index === 2 ? 'live' : index < 2 ? 'complete' : 'default',
        })),
    })
    const config = useTc<HTMLElement>({
        entries: tab.config.map((entry) => ({
            key: entry.key,
            value: /^(true|false|-?\d+(\.\d+)?)$/.test(entry.value)
                ? Number.isNaN(Number(entry.value))
                    ? entry.value === 'true'
                    : Number(entry.value)
                : entry.value,
            comment: entry.live ? 'live' : undefined,
        })),
    })
    const team = useTc<HTMLElement>({
        members: tab.team.map((member, index) => ({
            id: String(index),
            name: member.name,
            email: member.email,
            role: member.role,
        })),
    })
    const cdn = useTc<HTMLElement>({ nodes: CDN_NODES })

    return (
        <tc-row gutter="4" align="stretch">
            <tc-col span="12" span-lg="6" className="d-flex">
                <StageCard stage={tab.stages[0]}>
                    <AssetLines lines={tab.assets} />
                </StageCard>
            </tc-col>
            <tc-col span="12" span-lg="6" className="d-flex">
                <StageCard stage={tab.stages[1]}>
                    <tc-bundle-bar
                        ref={bundle}
                        segments="24"
                        filled-segments="17"
                        name={tab.bundleName}
                        meta={tab.bundleMeta}
                    ></tc-bundle-bar>
                </StageCard>
            </tc-col>
            <tc-col span="12" className="d-flex">
                <StageCard stage={tab.stages[2]}>
                    <tc-pipeline ref={pipeline}></tc-pipeline>
                </StageCard>
            </tc-col>
            <tc-col span="12" span-lg="4" className="d-flex">
                <StageCard stage={tab.stages[3]}>
                    <tc-config-preview ref={config} live-label="live"></tc-config-preview>
                </StageCard>
            </tc-col>
            <tc-col span="12" span-lg="4" className="d-flex">
                <StageCard stage={tab.stages[4]}>
                    <tc-team-list ref={team}></tc-team-list>
                </StageCard>
            </tc-col>
            <tc-col span="12" span-lg="4" className="d-flex">
                <StageCard stage={tab.stages[5]}>
                    <tc-cdn-map ref={cdn} height="200"></tc-cdn-map>
                </StageCard>
            </tc-col>
        </tc-row>
    )
}

const PublicPlanCard: React.FC<{ plan: Plan; actionLabel: string; onSelect: () => void; highlight: boolean }> = ({
    plan,
    actionLabel,
    onSelect,
    highlight,
}) => {
    const { t } = useStrings()
    const b = t.billing

    const card = useTc<HTMLElement>({
        features: plan.features.length > 0 ? plan.features : [plan.description].filter(Boolean),
        action: { label: actionLabel, variant: 'primary', size: 'large', onClick: onSelect },
    })

    return (
        <tc-pricing-card
            ref={card}
            className="w-100"
            name={plan.name}
            price={formatPrice(plan) || b.freePrice}
            period={plan.priceCents === 0 ? undefined : plan.interval === 'year' ? b.perYear : b.perMonth}
            description={plan.description || undefined}
            highlight={highlight || undefined}
            badge-text={highlight ? 'POPULAR' : undefined}
        ></tc-pricing-card>
    )
}

const Landing: React.FC = () => {
    const { t } = useStrings()
    const l = t.landing
    const { isAuthenticated } = useAuth()
    const publicConstants = useStore((state) => state.publicConstants)
    const fetchPublicConstants = useStore((state) => state.fetchPublicConstants)
    const [activeTab, setActiveTab] = useState<string>(l.howTabs[0].key)

    useEffect(() => {
        void fetchPublicConstants()
    }, [fetchPublicConstants])

    const plans = publicConstants?.features.billing ? publicConstants.plans : []

    const entryPath = isAuthenticated ? '/profile' : '/login'
    const entryLabel = isAuthenticated ? l.ctaDashboard : l.ctaPrimary
    const enterApp = () => {
        if (isAuthenticated) window.location.assign('/dashboard')
        else scrollTo('early-access')()
    }

    const nav = useTc<HTMLElement>({
        items: [
            { label: l.footerHowItWorks, href: '#how-it-works' },
            { label: l.footerFeatures, href: '#features' },
            { label: l.footerPricing, href: '#pricing' },
        ],
        onLogin: enterApp,
    })

    const hero = useTc<HTMLElement>({
        primaryAction: { label: entryLabel, icon: 'Rocket' },
        secondaryAction: { label: l.ctaSecondary, icon: 'PlayCircle' },
        bgIcons: HERO_ICONS,
        onPrimaryAction: enterApp,
        onSecondaryAction: scrollTo('features'),
    })

    const faq = useTc<HTMLElement>({
        items: l.faq.map((entry) => ({ question: entry.q, answer: entry.a })),
        defaultOpen: [0],
    })

    const showcase = useTc<HTMLElement>({
        items: l.features.map((feature) => ({
            title: feature.title,
            description: feature.description,
            icon: feature.icon,
        })),
    })

    const footer = useTc<HTMLElement>({
        menus: [
            {
                title: l.footerProduct,
                links: [
                    { label: l.footerHowItWorks, href: '#how-it-works' },
                    { label: l.footerFeatures, href: '#features' },
                    { label: l.footerPricing, href: '#pricing' },
                    { label: l.footerEarlyAccess, href: '#early-access' },
                ],
            },
            {
                title: l.footerCommunity,
                links: [
                    { label: l.footerGithub, href: 'https://github.com' },
                    { label: l.footerDiscord, href: 'https://discord.com' },
                ],
            },
        ],
        socialLinks: [
            { icon: 'Github', href: 'https://github.com', label: l.footerGithub },
            { icon: 'MessageCircle', href: 'https://discord.com', label: l.footerDiscord },
        ],
        legalLinks: [
            { label: l.footerTerms, href: '/terms' },
            { label: l.footerPrivacy, href: '/privacy' },
            { label: l.footerDmca, href: '/dmca' },
        ],
    })

    const tab = l.howTabs.find((entry) => entry.key === activeTab) ?? l.howTabs[0]

    return (
        <div className="module module-landing bg-white min-vh-100">
            <tc-announcement-bar
                variant="announce"
                icon-name="MessageCircle"
                cta-label={l.announceCta}
                cta-href="https://discord.com"
            >
                {l.announceText}
            </tc-announcement-bar>

            <tc-cool-nav ref={nav} sticky login-label={entryLabel}>
                <tc-brand
                    slot="brand"
                    primary-text="WEBGAME"
                    secondary-text=".CLOUD"
                    label="alpha"
                ></tc-brand>
            </tc-cool-nav>

            <main>
                <tc-hero
                    ref={hero}
                    eyebrow={l.eyebrow}
                    title={l.heroTitle}
                    title-as="h1"
                    description={l.heroDescription}
                    backdrop="grid"
                ></tc-hero>

                <section className="py-5">
                    <tc-container>
                        <LandingMetrics
                            metrics={l.metrics}
                            uptimeCaption={l.metricsUptimeCaption}
                            rolloutFrom={l.metricsRolloutFrom}
                            rolloutTo={l.metricsRolloutTo}
                        />
                    </tc-container>
                </section>

                <section id="how-it-works" className="py-5 py-md-7">
                    <tc-container>
                        <SectionHead eyebrow={l.howEyebrow} title={l.howTitle} lead={l.howLead} />
                        <TcTabSections
                            activeKey={activeTab}
                            items={l.howTabs.map((entry) => ({
                                key: entry.key,
                                label: entry.label,
                                icon: entry.icon,
                            }))}
                            onChange={setActiveTab}
                        />
                        <div className="mt-4">
                            <HowPanel key={tab.key} tab={tab} />
                        </div>
                    </tc-container>
                </section>

                <section id="engines" className="py-5 py-md-7 bg-light">
                    <tc-container>
                        <SectionHead
                            eyebrow={l.enginesEyebrow}
                            title={l.enginesTitle}
                            lead={l.enginesLead}
                        />
                        <EngineCards engines={l.engines} />
                    </tc-container>
                </section>

                <section id="features" className="py-5 py-md-7">
                    <tc-container>
                        <tc-pinned-feature-showcase
                            ref={showcase}
                            eyebrow={l.featuresEyebrow}
                            title={l.featuresTitle}
                            description={l.featuresIntro}
                        >
                            <div slot="media" className="d-flex flex-column gap-3">
                                <img
                                    className="w-100 h-auto"
                                    src="/imgs/features_showcase.svg"
                                    width="960"
                                    height="360"
                                    alt={l.featuresDiagramAlt}
                                    loading="lazy"
                                />
                                <AssetLines lines={l.howTabs[0].assets} />
                            </div>
                            <div slot="ctas" className="d-flex flex-wrap gap-3">
                                <tc-cool-button variant="primary" onClick={enterApp}>
                                    {l.featuresPrimaryCta}
                                </tc-cool-button>
                                <tc-cool-button
                                    variant="secondary"
                                    outline
                                    onClick={scrollTo('how-it-works')}
                                >
                                    {l.featuresSecondaryCta}
                                </tc-cool-button>
                            </div>
                        </tc-pinned-feature-showcase>
                    </tc-container>
                </section>

                {plans.length > 0 && (
                    <section id="pricing" className="py-5 py-md-7 bg-light">
                        <tc-container>
                            <SectionHead
                                eyebrow={l.pricingEyebrow}
                                title={l.pricingTitle}
                                lead={l.pricingIntro}
                            />
                            <tc-row gutter="4" align="stretch">
                                {plans.map((plan, index) => (
                                    <tc-col key={plan.id} span="12" span-md="6" span-lg="4" className="d-flex">
                                        <PublicPlanCard
                                            plan={plan}
                                            highlight={plans.length > 2 && index === 1}
                                            actionLabel={l.pricingStart}
                                            onSelect={scrollTo('early-access')}
                                        />
                                    </tc-col>
                                ))}
                            </tc-row>
                            <p className="text-center small text-muted mt-4 mb-0">{l.pricingFairUse}</p>
                        </tc-container>
                    </section>
                )}

                <section id="faq" className="py-5 py-md-7">
                    <tc-container>
                        <SectionHead eyebrow={l.faqEyebrow} title={l.faqTitle} lead={l.faqLead} />
                        <div className="landing-faq">
                            <tc-faq-list ref={faq} schema></tc-faq-list>
                        </div>
                    </tc-container>
                </section>

                <LandingSignup />
            </main>

            <tc-page-footer ref={footer} tagline={l.footerDescription} legal-text={l.footerLegalLine}>
                <tc-brand
                    slot="brand"
                    primary-text="WEBGAME"
                    secondary-text=".CLOUD"
                    label="alpha"
                ></tc-brand>
            </tc-page-footer>
        </div>
    )
}

export default Landing
