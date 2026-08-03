import React from 'react'
import useStrings from 'hooks/useStrings'
import { stepZoom } from 'helpers/zoom'

type EditorZoomProps = {
    zoom: number
    fit: number
    onZoom: (next: (current: number) => number) => void
    onFitZoom: () => void
}

const EditorZoom: React.FC<EditorZoomProps> = ({ zoom, fit, onZoom, onFitZoom }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <span className="ed-status__zoom">
            <button
                type="button"
                className="ed-btn ed-btn--icon"
                aria-label={k.zoomOut}
                title={k.zoomOut}
                onClick={() => onZoom((current) => stepZoom(current, -1))}
            >
                <tc-icon name="Minus" size="13" decorative></tc-icon>
            </button>
            <span className="ed-status__value">{k.zoomValue(Math.round(fit * zoom * 100))}</span>
            <button
                type="button"
                className="ed-btn ed-btn--icon"
                aria-label={k.zoomIn}
                title={k.zoomIn}
                onClick={() => onZoom((current) => stepZoom(current, 1))}
            >
                <tc-icon name="Plus" size="13" decorative></tc-icon>
            </button>
            <button type="button" className="ed-btn" onClick={onFitZoom}>
                {k.zoomFit}
            </button>
        </span>
    )
}

export default EditorZoom
