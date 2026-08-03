import React, { forwardRef, useMemo } from 'react'
import { parseLayerCss } from 'helpers/designCss'
import { FrameTemplate, DESIGN_FORMAT_SIZES, DesignLayer } from 'types'

const FONT_STACKS: Record<string, string> = {
    sans: 'Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

const AVERAGE_GLYPH_RATIO = 0.54

const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const budget = Math.max(1, Math.floor(maxWidth / (fontSize * AVERAGE_GLYPH_RATIO)))
    return text
        .split('\n')
        .flatMap((paragraph) => {
            const words = paragraph.split(/\s+/).filter(Boolean)
            if (words.length === 0) return ['']
            const lines: string[] = []
            let line = ''
            for (const word of words) {
                const candidate = line ? `${line} ${word}` : word
                if (candidate.length <= budget) {
                    line = candidate
                } else {
                    if (line) lines.push(line)
                    line = word
                }
            }
            if (line) lines.push(line)
            return lines
        })
}

const resolveValue = (layer: DesignLayer, values: Record<string, string>, template: FrameTemplate): string => {
    if (!layer.field) return layer.text
    const supplied = values[layer.field]
    if (supplied !== undefined && supplied !== '') return supplied
    const field = template.fields.find((entry) => entry.key === layer.field)
    return field?.sample ?? layer.text
}

const GRADIENT_VECTORS: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
    down: { x1: '0', y1: '0', x2: '0', y2: '1' },
    up: { x1: '0', y1: '1', x2: '0', y2: '0' },
    right: { x1: '0', y1: '0', x2: '1', y2: '0' },
    left: { x1: '1', y1: '0', x2: '0', y2: '0' },
}

type DesignCanvasProps = {
    template: FrameTemplate
    values?: Record<string, string>

    className?: string
}

const DesignCanvas = forwardRef<SVGSVGElement, DesignCanvasProps>(({ template, values = {}, className }, ref) => {
    const size = DESIGN_FORMAT_SIZES[template.format]

    const layers = useMemo(
        () =>
            template.layers.map((layer) => {
                const x = (layer.x / 100) * size.width
                const y = (layer.y / 100) * size.height
                const width = (layer.width / 100) * size.width
                const height = (layer.height / 100) * size.height
                return { layer, x, y, width, height, style: parseLayerCss(layer.css) }
            }),
        [template.layers, size.width, size.height]
    )

    return (
        <svg
            ref={ref}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${size.width} ${size.height}`}
            width={size.width}
            height={size.height}
        >
            <defs>
                {layers.map(({ layer }) =>
                    layer.kind === 'gradient' ? (
                        <linearGradient
                            key={`grad-${layer.id}`}
                            id={`grad-${layer.id}`}
                            {...GRADIENT_VECTORS[layer.gradientDirection] ?? GRADIENT_VECTORS.down}
                        >
                            <stop offset="0%" stopColor={layer.color} stopOpacity="0" />
                            <stop offset="100%" stopColor={layer.gradientTo} stopOpacity="1" />
                        </linearGradient>
                    ) : null
                )}
                {layers.map(({ layer, x, y, width, height }) =>
                    layer.kind === 'image' ? (
                        <clipPath key={`clip-${layer.id}`} id={`clip-${layer.id}`}>
                            <rect x={x} y={y} width={width} height={height} rx={layer.radius} />
                        </clipPath>
                    ) : null
                )}
            </defs>

            <rect x={0} y={0} width={size.width} height={size.height} fill={template.background} />

            {layers.map(({ layer, x, y, width, height, style }) => {
                if (layer.kind === 'rect') {
                    return (
                        <rect
                            key={layer.id}
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            rx={layer.radius}
                            fill={layer.color}
                            opacity={layer.opacity}
                            style={style}
                        />
                    )
                }

                if (layer.kind === 'ellipse') {
                    return (
                        <ellipse
                            key={layer.id}
                            cx={x + width / 2}
                            cy={y + height / 2}
                            rx={width / 2}
                            ry={height / 2}
                            fill={layer.color}
                            opacity={layer.opacity}
                            style={style}
                        />
                    )
                }

                if (layer.kind === 'gradient') {
                    return (
                        <rect
                            key={layer.id}
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={`url(#grad-${layer.id})`}
                            opacity={layer.opacity}
                            style={style}
                        />
                    )
                }

                if (layer.kind === 'image') {
                    const href = resolveValue(layer, values, template)
                    if (!href) {
                        return (
                            <rect
                                key={layer.id}
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                rx={layer.radius}
                                fill="#e4e4e7"
                                opacity={layer.opacity}
                                style={style}
                            />
                        )
                    }
                    return (
                        <image
                            key={layer.id}
                            href={href}
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            opacity={layer.opacity}
                            preserveAspectRatio={layer.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
                            clipPath={`url(#clip-${layer.id})`}
                            style={style}
                        />
                    )
                }

                const raw = resolveValue(layer, values, template)
                const content = layer.uppercase ? raw.toUpperCase() : raw
                const lines = wrapText(content, width, layer.fontSize)
                const anchor = layer.align === 'center' ? 'middle' : layer.align === 'right' ? 'end' : 'start'
                const textX = layer.align === 'center' ? x + width / 2 : layer.align === 'right' ? x + width : x
                const lineStep = layer.fontSize * layer.lineHeight

                return (
                    <text
                        key={layer.id}
                        x={textX}
                        y={y + layer.fontSize}
                        fill={layer.color}
                        opacity={layer.opacity}
                        fontFamily={FONT_STACKS[layer.font] ?? FONT_STACKS.sans}
                        fontSize={layer.fontSize}
                        fontWeight={layer.fontWeight}
                        letterSpacing={layer.letterSpacing}
                        textAnchor={anchor}
                        style={style}
                    >
                        {lines.map((line, index) => (
                            <tspan key={`${layer.id}-${index}`} x={textX} dy={index === 0 ? 0 : lineStep}>
                                {line}
                            </tspan>
                        ))}
                    </text>
                )
            })}
        </svg>
    )
})

DesignCanvas.displayName = 'DesignCanvas'

export default DesignCanvas
