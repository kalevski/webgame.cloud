import React from 'react'

type Engine = {
    key: string
    name: string
    note: string
    detail: string
    tags: readonly string[]
}

type EngineCardsProps = {
    engines: readonly Engine[]
}

type IndexStyle = React.CSSProperties & { '--i': number }

const LOGOS: Record<string, string> = {
    phaser: '/imgs/phaser-planet-small.png',
    pixi: '/imgs/pixijs-logo-transparent-light.png',
}

const STAGE_BLOCK_COUNT = 48

const indexStyle = (index: number): IndexStyle => ({ '--i': index })

const CanvasMark: React.FC = () => (
    <svg className="engine-mark" viewBox="0 0 32 32" role="img" aria-hidden="true" focusable="false">
        <rect className="engine-mark__frame" x="3.5" y="5.5" width="25" height="21" rx="3" />
        <path className="engine-mark__grid" d="M11.5 5.5v21M20.5 5.5v21M3.5 12.5h25M3.5 19.5h25" />
        <path className="engine-mark__stroke" d="M7 22.5 12.5 15l5 5.2L25 9.5" />
        <circle className="engine-mark__nib" cx="25" cy="9.5" r="2.4" />
    </svg>
)

const EngineCard: React.FC<{ engine: Engine }> = ({ engine }) => {
    const logo = LOGOS[engine.key]

    return (
        <li className="engine-card" data-engine={engine.key}>
            <span className="engine-card__tick engine-card__tick--tl" aria-hidden="true"></span>
            <span className="engine-card__tick engine-card__tick--br" aria-hidden="true"></span>

            <div className="engine-card__badge">
                <span className="engine-card__ring" aria-hidden="true"></span>
                {logo ? (
                    <img className="engine-card__logo" src={logo} alt="" aria-hidden="true" />
                ) : (
                    <CanvasMark />
                )}
            </div>

            <h3 className="engine-card__name">{engine.name}</h3>
            <p className="engine-card__note">{engine.note}</p>
            <p className="engine-card__detail">{engine.detail}</p>

            <ul className="engine-card__tags">
                {engine.tags.map((tag) => (
                    <li key={tag} className="engine-card__tag">
                        {tag}
                    </li>
                ))}
            </ul>

            <div className="engine-card__stage" aria-hidden="true">
                {Array.from({ length: STAGE_BLOCK_COUNT }, (unused, index) => (
                    <span key={`block-${index}`} className="engine-card__block" style={indexStyle(index)}></span>
                ))}
            </div>
        </li>
    )
}

const EngineCards: React.FC<EngineCardsProps> = ({ engines }) => (
    <ul className="engine-cards">
        {engines.map((engine) => (
            <EngineCard key={engine.key} engine={engine} />
        ))}
    </ul>
)

export default EngineCards
