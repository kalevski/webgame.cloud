import React from 'react'

type Metric = {
    key: string
    value: string
    label: string
    helper: string
}

type LandingMetricsProps = {
    metrics: readonly Metric[]
    uptimeCaption: string
    rolloutFrom: string
    rolloutTo: string
}

type BarStyle = React.CSSProperties & { '--bar-index': number; '--bar-height': string }

const UPTIME_BARS = [
    62, 74, 58, 81, 69, 90, 77, 64, 86, 72, 95, 68, 79, 88, 61,
    83, 70, 92, 66, 78, 85, 73, 97, 63, 80, 89, 71, 84, 76, 93,
]

const barStyle = (index: number, height: number): BarStyle => ({
    '--bar-index': index,
    '--bar-height': `${height}%`,
})

const UptimeGraph: React.FC<{ caption: string }> = ({ caption }) => (
    <div className="landing-metric__graph">
        <div className="landing-metric__bars" aria-hidden="true">
            {UPTIME_BARS.map((height, index) => (
                <span
                    key={`bar-${index}-${height}`}
                    className="landing-metric__bar"
                    style={barStyle(index, height)}
                ></span>
            ))}
        </div>
        <p className="landing-metric__caption">{caption}</p>
    </div>
)

const RolloutGraph: React.FC<{ from: string; to: string }> = ({ from, to }) => (
    <div className="landing-metric__graph">
        <div className="landing-metric__track" aria-hidden="true">
            <span className="landing-metric__node landing-metric__node--start"></span>
            <span className="landing-metric__wire"></span>
            <span className="landing-metric__packet"></span>
            <span className="landing-metric__node landing-metric__node--end"></span>
        </div>
        <p className="landing-metric__caption">
            <span>{from}</span>
            <span className="landing-metric__caption-dash" aria-hidden="true"></span>
            <span>{to}</span>
        </p>
    </div>
)

const LandingMetrics: React.FC<LandingMetricsProps> = ({ metrics, uptimeCaption, rolloutFrom, rolloutTo }) => (
    <div className="landing-metrics">
        {metrics.map((metric) => (
            <article key={metric.key} className="landing-metric" data-metric={metric.key}>
                <span className="landing-metric__tick landing-metric__tick--tl" aria-hidden="true"></span>
                <span className="landing-metric__tick landing-metric__tick--br" aria-hidden="true"></span>

                <header className="landing-metric__head">
                    <span className="landing-metric__pip" aria-hidden="true"></span>
                    <p className="landing-metric__label">{metric.label}</p>
                </header>

                <p className="landing-metric__value">{metric.value}</p>
                <p className="landing-metric__helper">{metric.helper}</p>

                {metric.key === 'uptime' ? (
                    <UptimeGraph caption={uptimeCaption} />
                ) : (
                    <RolloutGraph from={rolloutFrom} to={rolloutTo} />
                )}
            </article>
        ))}
    </div>
)

export default LandingMetrics
