import React from 'react'
import { toIconName } from 'helpers/icons'

export type ChoiceCardOption = {
    key: string
    name: string
    note: string
    detail?: string
    icon?: string
    logo?: string
    tags?: readonly string[]
}

type ChoiceCardsProps = {
    options: readonly ChoiceCardOption[]
    value: string
    onChange: (value: string) => void
    label: string
    disabled?: boolean
}

const STAGE_BLOCK_COUNT = 24

type IndexStyle = React.CSSProperties & { '--i': number }

const indexStyle = (index: number): IndexStyle => ({ '--i': index })

const ChoiceCards: React.FC<ChoiceCardsProps> = ({ options, value, onChange, label, disabled = false }) => (
    <div className="app-type-cards" role="radiogroup" aria-label={label}>
        {options.map((option) => {
            const selected = option.key === value
            return (
                <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="app-type-card"
                    data-app-type={option.key}
                    data-selected={selected || undefined}
                    disabled={disabled}
                    onClick={() => onChange(option.key)}
                >
                    <span className="app-type-card__tick app-type-card__tick--tl" aria-hidden="true"></span>
                    <span className="app-type-card__tick app-type-card__tick--br" aria-hidden="true"></span>

                    <span className="app-type-card__badge">
                        <span className="app-type-card__ring" aria-hidden="true"></span>
                        {option.logo ? (
                            <img className="app-type-card__logo" src={option.logo} alt="" aria-hidden="true" />
                        ) : (
                            <tc-icon name={toIconName(option.icon ?? '')} size="26"></tc-icon>
                        )}
                    </span>

                    <span className="app-type-card__name">{option.name}</span>
                    <span className="app-type-card__note">{option.note}</span>
                    {option.detail && <span className="app-type-card__detail">{option.detail}</span>}

                    {option.tags && option.tags.length > 0 && (
                        <span className="app-type-card__tags">
                            {option.tags.map((tag) => (
                                <span key={tag} className="app-type-card__tag">
                                    {tag}
                                </span>
                            ))}
                        </span>
                    )}

                    <span className="app-type-card__stage" aria-hidden="true">
                        {Array.from({ length: STAGE_BLOCK_COUNT }, (unused, index) => (
                            <span key={`block-${index}`} className="app-type-card__block" style={indexStyle(index)}></span>
                        ))}
                    </span>
                </button>
            )
        })}
    </div>
)

export default ChoiceCards
