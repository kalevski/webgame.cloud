import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import DesignCanvas from 'components/DesignCanvas'
import EditorStage from 'components/EditorStage'
import { FrameTemplate, DESIGN_FORMAT_SIZES, DesignLayer, DesignLayerKind } from 'types'

export const LAYER_DRAG_TYPE = 'application/x-story-layer-kind'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

type Handle = typeof HANDLES[number]

type Geometry = Pick<DesignLayer, 'x' | 'y' | 'width' | 'height'>

type DragState = {
    pointerId: number
    handle: Handle | null
    startX: number
    startY: number
    origin: Geometry
}

const round = (value: number): number => Math.round(value * 10) / 10

const clampGeometry = (geometry: Geometry): Geometry => ({
    x: round(Math.min(150, Math.max(-50, geometry.x))),
    y: round(Math.min(150, Math.max(-50, geometry.y))),
    width: round(Math.min(200, Math.max(1, geometry.width))),
    height: round(Math.min(200, Math.max(1, geometry.height))),
})

const resize = (origin: Geometry, handle: Handle, deltaX: number, deltaY: number): Geometry => {
    const west = handle.includes('w')
    const east = handle.includes('e')
    const north = handle.includes('n')
    const south = handle.includes('s')

    return {
        x: west ? origin.x + deltaX : origin.x,
        y: north ? origin.y + deltaY : origin.y,
        width: west ? origin.width - deltaX : east ? origin.width + deltaX : origin.width,
        height: north ? origin.height - deltaY : south ? origin.height + deltaY : origin.height,
    }
}

type DesignArtboardProps = {
    template: FrameTemplate
    values?: Record<string, string>

    zoom: number
    onFit?: (fit: number) => void

    selectedId: string
    onSelect: (id: string) => void
    onGeometry: (id: string, geometry: Geometry) => void

    onDropLayer?: (kind: DesignLayerKind, x: number, y: number) => void
}

const DesignArtboard = forwardRef<SVGSVGElement, DesignArtboardProps>(
    ({ template, values, zoom, onFit, selectedId, onSelect, onGeometry, onDropLayer }, ref) => {
        const frameRef = useRef<HTMLDivElement>(null)
        const dragRef = useRef<DragState | null>(null)
        const [dropping, setDropping] = useState(false)

        const size = DESIGN_FORMAT_SIZES[template.format]

        const fieldLabels = useMemo(
            () => new Map(template.fields.map((field) => [field.key, field.label || field.key])),
            [template.fields]
        )

        const beginDrag = useCallback(
            (event: React.PointerEvent, layer: DesignLayer, handle: Handle | null) => {
                event.preventDefault()
                event.stopPropagation()
                onSelect(layer.id)
                const box = frameRef.current?.getBoundingClientRect()
                if (!box) return
                dragRef.current = {
                    pointerId: event.pointerId,
                    handle,
                    startX: ((event.clientX - box.left) / box.width) * 100,
                    startY: ((event.clientY - box.top) / box.height) * 100,
                    origin: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
                }
                event.currentTarget.setPointerCapture(event.pointerId)
            },
            [onSelect]
        )

        const moveDrag = useCallback(
            (event: React.PointerEvent, layerId: string) => {
                const drag = dragRef.current
                if (!drag || drag.pointerId !== event.pointerId) return
                const box = frameRef.current?.getBoundingClientRect()
                if (!box) return

                const deltaX = ((event.clientX - box.left) / box.width) * 100 - drag.startX
                const deltaY = ((event.clientY - box.top) / box.height) * 100 - drag.startY

                if (!drag.handle) {
                    onGeometry(
                        layerId,
                        clampGeometry({
                            x: drag.origin.x + deltaX,
                            y: drag.origin.y + deltaY,
                            width: drag.origin.width,
                            height: drag.origin.height,
                        })
                    )
                    return
                }

                onGeometry(layerId, clampGeometry(resize(drag.origin, drag.handle, deltaX, deltaY)))
            },
            [onGeometry]
        )

        const endDrag = useCallback((event: React.PointerEvent) => {
            if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
        }, [])

        const handleDrop = (event: React.DragEvent) => {
            event.preventDefault()
            setDropping(false)
            const kind = event.dataTransfer.getData(LAYER_DRAG_TYPE) as DesignLayerKind
            if (!kind || !onDropLayer) return
            const box = frameRef.current?.getBoundingClientRect()
            if (!box) return
            onDropLayer(
                kind,
                round(((event.clientX - box.left) / box.width) * 100),
                round(((event.clientY - box.top) / box.height) * 100)
            )
        }

        return (
            <EditorStage
                ref={frameRef}
                className="ed-stage__art"
                width={size.width}
                height={size.height}
                zoom={zoom}
                onFit={onFit}
                data-dropping={dropping ? 'true' : undefined}
                onDragOver={(event) => {
                    if (!onDropLayer) return
                    event.preventDefault()
                    setDropping(true)
                }}
                onDragLeave={() => setDropping(false)}
                onDrop={handleDrop}
            >
                <DesignCanvas ref={ref} template={template} values={values} />

                <div
                    className="ed-stage__overlay"
                    role="presentation"
                    onPointerDown={(event) => {
                        if (event.target === event.currentTarget) onSelect('')
                    }}
                >
                    {template.layers.map((layer) => (
                        <div
                            key={layer.id}
                            className="ed-box"
                            data-selected={layer.id === selectedId ? 'true' : undefined}
                            data-bound={layer.field ? 'true' : undefined}
                            style={{
                                left: `${layer.x}%`,
                                top: `${layer.y}%`,
                                width: `${layer.width}%`,
                                height: `${layer.height}%`,
                            }}
                            onPointerDown={(event) => beginDrag(event, layer, null)}
                            onPointerMove={(event) => moveDrag(event, layer.id)}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                        >
                            {layer.id === selectedId && layer.field && (
                                <span className="ed-box__tag">
                                    {fieldLabels.get(layer.field) ?? layer.field}
                                </span>
                            )}
                            {layer.id === selectedId &&
                                HANDLES.map((handle) => (
                                    <span
                                        key={handle}
                                        className="ed-box__handle"
                                        data-handle={handle}
                                        onPointerDown={(event) => beginDrag(event, layer, handle)}
                                        onPointerMove={(event) => moveDrag(event, layer.id)}
                                        onPointerUp={endDrag}
                                        onPointerCancel={endDrag}
                                    />
                                ))}
                        </div>
                    ))}
                </div>
            </EditorStage>
        )
    }
)

DesignArtboard.displayName = 'DesignArtboard'

export default DesignArtboard
