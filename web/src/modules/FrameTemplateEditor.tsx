import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useEditorShortcuts from 'hooks/useEditorShortcuts'
import DesignArtboard, { LAYER_DRAG_TYPE } from 'components/DesignArtboard'
import EditorShell, { EditorPanel } from 'components/EditorShell'
import EditorZoom from 'components/EditorZoom'
import DesignService from 'services/DesignService'
import { downloadSvgAsPng, fileToDataUrl } from 'helpers/designExport'
import {
    FrameTemplate,
    DESIGN_ALIGNMENTS,
    DESIGN_FIELD_KINDS,
    DESIGN_FONTS,
    DESIGN_FORMAT_SIZES,
    DESIGN_FORMATS,
    DESIGN_GRADIENT_DIRECTIONS,
    DESIGN_IMAGE_FITS,
    DESIGN_LAYER_KINDS,
    DESIGN_LAYER_LIMIT,
    DesignField,
    DesignFieldKind,
    DesignFormat,
    DesignLayer,
    DesignLayerKind,
    DesignSourceInfo,
    designLayerDefaults,
} from 'types'

const LAYER_GLYPHS: Record<DesignLayerKind, string> = {
    rect: 'Square',
    ellipse: 'Circle',
    gradient: 'Contrast',
    text: 'Type',
    image: 'Image',
}

const newId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())

const toNumber = (raw: string, fallback: number): number => {
    if (raw.trim() === '') return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
}

type EditableField = DesignField & { uid: string }

const withUid = (fields: DesignField[]): EditableField[] =>
    fields.map((field) => ({ ...field, uid: newId() }))

type NumberFieldProps = {
    label: string
    value: number
    step?: string
    min?: number
    max?: number
    onChange: (next: number) => void
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, step, min, max, onChange }) => (
    <label className="ed-field">
        <span className="ed-field__label">{label}</span>
        <input
            type="number"
            className="ed-input ed-input--num"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(event) => onChange(toNumber(event.target.value, value))}
        />
    </label>
)

type SelectFieldProps = {
    label: string
    value: string
    options: ReadonlyArray<{ value: string; label: string }>
    wide?: boolean
    onChange: (next: string) => void
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, wide, onChange }) => (
    <label className={wide ? 'ed-field ed-field--wide' : 'ed-field'}>
        <span className="ed-field__label">{label}</span>
        <select className="ed-select" value={value} onChange={(event) => onChange(event.target.value)}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </label>
)

type LayersPanelProps = {
    layers: DesignLayer[]
    fields: EditableField[]
    selectedId: string
    onSelect: (id: string) => void
    onMove: (id: string, direction: -1 | 1) => void
    onDuplicate: (id: string) => void
    onRemove: (id: string) => void
}

const LayersPanel: React.FC<LayersPanelProps> = ({
    layers,
    fields,
    selectedId,
    onSelect,
    onMove,
    onDuplicate,
    onRemove,
}) => {
    const { t } = useStrings()
    const k = t.studio

    const labels = useMemo(
        () => new Map(fields.map((field) => [field.key, field.label || field.key])),
        [fields]
    )

    if (layers.length === 0) return <p className="ed-panel__empty">{k.layerEmpty}</p>

    return (
        <ol className="ed-layers">
            {layers.map((layer, index) => (
                <li
                    key={layer.id}
                    className="ed-layer"
                    data-selected={layer.id === selectedId ? 'true' : undefined}
                >
                    <button type="button" className="ed-layer__pick" onClick={() => onSelect(layer.id)}>
                        <span className="ed-layer__glyph">
                            <tc-icon name={LAYER_GLYPHS[layer.kind]} size="14" decorative></tc-icon>
                        </span>
                        <span className="ed-layer__name">
                            {layer.text || k.layerKinds[layer.kind]}
                        </span>
                        {layer.field && (
                            <span className="ed-layer__bound">{labels.get(layer.field) ?? layer.field}</span>
                        )}
                    </button>
                    <span className="ed-layer__tools">
                        <button
                            type="button"
                            className="ed-layer__tool"
                            aria-label={k.layerUp}
                            title={k.layerUp}
                            disabled={index === 0}
                            onClick={() => onMove(layer.id, -1)}
                        >
                            <tc-icon name="ChevronUp" size="14" decorative></tc-icon>
                        </button>
                        <button
                            type="button"
                            className="ed-layer__tool"
                            aria-label={k.layerDown}
                            title={k.layerDown}
                            disabled={index === layers.length - 1}
                            onClick={() => onMove(layer.id, 1)}
                        >
                            <tc-icon name="ChevronDown" size="14" decorative></tc-icon>
                        </button>
                        <button
                            type="button"
                            className="ed-layer__tool"
                            aria-label={k.duplicateLayer}
                            title={k.duplicateLayer}
                            onClick={() => onDuplicate(layer.id)}
                        >
                            <tc-icon name="Copy" size="13" decorative></tc-icon>
                        </button>
                        <button
                            type="button"
                            className="ed-layer__tool"
                            aria-label={k.layerRemove}
                            title={k.layerRemove}
                            onClick={() => onRemove(layer.id)}
                        >
                            <tc-icon name="Trash2" size="13" decorative></tc-icon>
                        </button>
                    </span>
                </li>
            ))}
        </ol>
    )
}

type LayerPanelProps = {
    layer: DesignLayer | null
    fields: EditableField[]
    onPatch: (patch: Partial<DesignLayer>) => void
}

const LayerPanel: React.FC<LayerPanelProps> = ({ layer, fields, onPatch }) => {
    const { t } = useStrings()
    const k = t.studio

    if (!layer) return <p className="ed-panel__empty">{k.noLayerSelected}</p>

    return (
        <>
            <div className="ed-panel__group">
                <span className="ed__caps">{k.groupGeometry}</span>
                <div className="ed-grid">
                    <NumberField label={k.propX} value={layer.x} step="0.5" onChange={(x) => onPatch({ x })} />
                    <NumberField label={k.propY} value={layer.y} step="0.5" onChange={(y) => onPatch({ y })} />
                    <NumberField
                        label={k.propWidth}
                        value={layer.width}
                        step="0.5"
                        onChange={(width) => onPatch({ width })}
                    />
                    <NumberField
                        label={k.propHeight}
                        value={layer.height}
                        step="0.5"
                        onChange={(height) => onPatch({ height })}
                    />

                    <label className="ed-field">
                        <span className="ed-field__label">{k.propColor}</span>
                        <input
                            type="color"
                            className="ed-swatch"
                            value={layer.color}
                            onChange={(event) => onPatch({ color: event.target.value })}
                        />
                    </label>

                    <NumberField
                        label={k.propOpacity}
                        value={layer.opacity}
                        step="0.05"
                        min={0}
                        max={1}
                        onChange={(opacity) => onPatch({ opacity })}
                    />
                </div>
            </div>

            {(layer.kind === 'text' || layer.kind === 'image') && (
                <div className="ed-panel__group">
                    <span className="ed__caps">{k.groupBinding}</span>
                    <div className="ed-grid ed-grid--wide">
                        <SelectField
                            label={k.propField}
                            value={layer.field}
                            wide
                            options={[
                                { value: '', label: k.fieldUnbound },
                                ...fields.map((field) => ({ value: field.key, label: field.label || field.key })),
                            ]}
                            onChange={(field) => onPatch({ field })}
                        />
                    </div>
                </div>
            )}

            {layer.kind === 'text' && (
                <div className="ed-panel__group">
                    <span className="ed__caps">{k.groupType}</span>
                    <div className="ed-grid">
                        <label className="ed-field ed-field--wide">
                            <span className="ed-field__label">{k.propText}</span>
                            <input
                                type="text"
                                className="ed-input"
                                value={layer.text}
                                onChange={(event) => onPatch({ text: event.target.value })}
                            />
                        </label>

                        <SelectField
                            label={k.propFont}
                            value={layer.font}
                            options={DESIGN_FONTS.map((font) => ({ value: font, label: k.fonts[font] }))}
                            onChange={(font) => onPatch({ font: font as DesignLayer['font'] })}
                        />
                        <SelectField
                            label={k.propAlign}
                            value={layer.align}
                            options={DESIGN_ALIGNMENTS.map((align) => ({ value: align, label: k.alignments[align] }))}
                            onChange={(align) => onPatch({ align: align as DesignLayer['align'] })}
                        />
                        <NumberField
                            label={k.propFontSize}
                            value={layer.fontSize}
                            onChange={(fontSize) => onPatch({ fontSize })}
                        />
                        <NumberField
                            label={k.propWeight}
                            value={layer.fontWeight}
                            step="100"
                            min={100}
                            max={900}
                            onChange={(fontWeight) => onPatch({ fontWeight })}
                        />
                        <NumberField
                            label={k.propLineHeight}
                            value={layer.lineHeight}
                            step="0.05"
                            onChange={(lineHeight) => onPatch({ lineHeight })}
                        />
                        <NumberField
                            label={k.propLetterSpacing}
                            value={layer.letterSpacing}
                            onChange={(letterSpacing) => onPatch({ letterSpacing })}
                        />

                        <label className="ed-check ed-field--wide">
                            <input
                                type="checkbox"
                                checked={layer.uppercase}
                                onChange={(event) => onPatch({ uppercase: event.target.checked })}
                            />
                            <span>{k.propUppercase}</span>
                        </label>
                    </div>
                </div>
            )}

            {(layer.kind === 'rect' || layer.kind === 'image' || layer.kind === 'gradient') && (
                <div className="ed-panel__group">
                    <span className="ed__caps">{k.groupShape}</span>
                    <div className="ed-grid">
                        {(layer.kind === 'rect' || layer.kind === 'image') && (
                            <NumberField
                                label={k.propRadius}
                                value={layer.radius}
                                onChange={(radius) => onPatch({ radius })}
                            />
                        )}
                        {layer.kind === 'image' && (
                            <SelectField
                                label={k.propFit}
                                value={layer.fit}
                                options={DESIGN_IMAGE_FITS.map((fit) => ({ value: fit, label: k.fits[fit] }))}
                                onChange={(fit) => onPatch({ fit: fit as DesignLayer['fit'] })}
                            />
                        )}
                        {layer.kind === 'gradient' && (
                            <>
                                <label className="ed-field">
                                    <span className="ed-field__label">{k.propGradientTo}</span>
                                    <input
                                        type="color"
                                        className="ed-swatch"
                                        value={layer.gradientTo}
                                        onChange={(event) => onPatch({ gradientTo: event.target.value })}
                                    />
                                </label>
                                <SelectField
                                    label={k.propGradientDirection}
                                    value={layer.gradientDirection}
                                    options={DESIGN_GRADIENT_DIRECTIONS.map((direction) => ({
                                        value: direction,
                                        label: k.directions[direction],
                                    }))}
                                    onChange={(direction) =>
                                        onPatch({
                                            gradientDirection: direction as DesignLayer['gradientDirection'],
                                        })
                                    }
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="ed-panel__group">
                <span className="ed__caps">{k.groupStyle}</span>
                <textarea
                    className="ed-textarea"
                    rows={3}
                    spellCheck={false}
                    aria-label={k.propCss}
                    placeholder={k.propCssPlaceholder}
                    value={layer.css}
                    onChange={(event) => onPatch({ css: event.target.value })}
                />
                <p className="ed-hint">{k.propCssHint}</p>
            </div>
        </>
    )
}

type FieldsPanelProps = {
    fields: EditableField[]
    sources: DesignSourceInfo[]
    boundKey: string
    onPatch: (uid: string, patch: Partial<DesignField>) => void
    onRemove: (uid: string) => void
    onAdd: () => void
}

const FieldsPanel: React.FC<FieldsPanelProps> = ({ fields, sources, boundKey, onPatch, onRemove, onAdd }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            <div className="ed-panel__head">
                <span className="ed__caps">{k.fieldsTitle}</span>
                <button type="button" className="ed-btn" onClick={onAdd}>
                    <tc-icon name="Plus" size="13" decorative></tc-icon>
                    {k.fieldAdd}
                </button>
            </div>
            <p className="ed-hint">{k.fieldsHint}</p>

            {fields.map((field) => (
                <div
                    key={field.uid}
                    className="ed-fieldrow"
                    data-active={field.key && field.key === boundKey ? 'true' : undefined}
                >
                    <div className="ed-fieldrow__body">
                        <label className="ed-field">
                            <span className="ed-field__label">{k.fieldKey}</span>
                            <input
                                type="text"
                                className="ed-input"
                                value={field.key}
                                onChange={(event) => onPatch(field.uid, { key: event.target.value })}
                            />
                        </label>
                        <label className="ed-field">
                            <span className="ed-field__label">{k.fieldLabel}</span>
                            <input
                                type="text"
                                className="ed-input"
                                value={field.label}
                                onChange={(event) => onPatch(field.uid, { label: event.target.value })}
                            />
                        </label>
                        <label className="ed-field">
                            <span className="ed-field__label">{k.fieldKind}</span>
                            <select
                                className="ed-select"
                                value={field.kind}
                                onChange={(event) =>
                                    onPatch(field.uid, { kind: event.target.value as DesignFieldKind })
                                }
                            >
                                {DESIGN_FIELD_KINDS.map((kind) => (
                                    <option key={kind} value={kind}>{k.fieldKinds[kind]}</option>
                                ))}
                            </select>
                        </label>
                        <label className="ed-field">
                            <span className="ed-field__label">{k.fieldSample}</span>
                            <input
                                type="text"
                                className="ed-input"
                                placeholder={k.fieldSample}
                                value={field.sample}
                                onChange={(event) => onPatch(field.uid, { sample: event.target.value })}
                            />
                        </label>

                        {sources.length > 0 && (
                            <label className="ed-field ed-fieldrow__wide">
                                <span className="ed-field__label">{k.sourceBinding}</span>
                                <select
                                    className="ed-select"
                                    value={field.source ? `${field.source}.${field.sourceField}` : ''}
                                    onChange={(event) => {
                                        const [source = '', sourceField = ''] = event.target.value.split('.')
                                        onPatch(field.uid, { source, sourceField })
                                    }}
                                >
                                    <option value="">{k.sourceNone}</option>
                                    {sources.flatMap((source) =>
                                        source.fields.map((entry) => (
                                            <option
                                                key={`${source.id}.${entry.key}`}
                                                value={`${source.id}.${entry.key}`}
                                            >
                                                {source.label} · {entry.label}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </label>
                        )}
                    </div>

                    <button
                        type="button"
                        className="ed-btn ed-btn--icon ed-btn--danger"
                        aria-label={k.fieldRemove}
                        title={k.fieldRemove}
                        onClick={() => onRemove(field.uid)}
                    >
                        <tc-icon name="Trash2" size="13" decorative></tc-icon>
                    </button>
                </div>
            ))}
        </>
    )
}

type FillPanelProps = {
    fields: EditableField[]
    values: Record<string, string>
    onChange: (key: string, value: string) => void
    onUpload: (key: string, file: File | undefined) => void
}

const FillPanel: React.FC<FillPanelProps> = ({ fields, values, onChange, onUpload }) => {
    const { t } = useStrings()
    const k = t.studio

    if (fields.length === 0) return <p className="ed-panel__empty">{k.fieldsHint}</p>

    return (
        <>
            <p className="ed-hint">{k.contentHint}</p>
            {fields.map((field) => (
                <label key={field.uid} className="ed-field">
                    <span className="ed-field__label">{field.label || field.key}</span>
                    {field.kind === 'image' ? (
                        <span className="ed-upload">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => onUpload(field.key, event.target.files?.[0])}
                            />
                            {values[field.key] && (
                                <button type="button" className="ed-btn" onClick={() => onChange(field.key, '')}>
                                    {k.clearImage}
                                </button>
                            )}
                        </span>
                    ) : field.kind === 'multiline' ? (
                        <textarea
                            className="ed-textarea"
                            rows={3}
                            value={values[field.key] ?? ''}
                            placeholder={field.sample}
                            onChange={(event) => onChange(field.key, event.target.value)}
                        />
                    ) : (
                        <input
                            type="text"
                            className="ed-input"
                            value={values[field.key] ?? ''}
                            placeholder={field.sample}
                            onChange={(event) => onChange(field.key, event.target.value)}
                        />
                    )}
                </label>
            ))}
        </>
    )
}

type SetupPanelProps = {
    name: string
    description: string
    format: DesignFormat
    background: string
    onPatch: (patch: Partial<{ name: string; description: string; format: DesignFormat; background: string }>) => void
}

const SetupPanel: React.FC<SetupPanelProps> = ({ name, description, format, background, onPatch }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <div className="ed-grid">
            <label className="ed-field ed-field--wide">
                <span className="ed-field__label">{k.nameLabel}</span>
                <input
                    type="text"
                    className="ed-input"
                    placeholder={k.namePlaceholder}
                    value={name}
                    onChange={(event) => onPatch({ name: event.target.value })}
                />
            </label>

            <label className="ed-field ed-field--wide">
                <span className="ed-field__label">{k.descriptionLabel}</span>
                <input
                    type="text"
                    className="ed-input"
                    value={description}
                    onChange={(event) => onPatch({ description: event.target.value })}
                />
            </label>

            <SelectField
                label={k.formatLabel}
                value={format}
                options={DESIGN_FORMATS.map((entry) => ({ value: entry, label: k.formats[entry] }))}
                onChange={(next) => onPatch({ format: next as DesignFormat })}
            />

            <label className="ed-field">
                <span className="ed-field__label">{k.backgroundLabel}</span>
                <input
                    type="color"
                    className="ed-swatch"
                    value={background}
                    onChange={(event) => onPatch({ background: event.target.value })}
                />
            </label>
        </div>
    )
}

type ToolRailProps = {
    onAdd: (kind: DesignLayerKind) => void
}

const ToolRail: React.FC<ToolRailProps> = ({ onAdd }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            {DESIGN_LAYER_KINDS.map((kind) => (
                <button
                    key={kind}
                    type="button"
                    className="ed-tool"
                    draggable
                    title={`${k.layerKinds[kind]} — ${k.layerDragHint}`}
                    aria-label={k.layerKinds[kind]}
                    onDragStart={(event) => {
                        event.dataTransfer.setData(LAYER_DRAG_TYPE, kind)
                        event.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => onAdd(kind)}
                >
                    <tc-icon name={LAYER_GLYPHS[kind]} size="16" decorative></tc-icon>
                    <span className="ed-tool__word">{k.layerKinds[kind]}</span>
                </button>
            ))}
        </>
    )
}

type FormatControlsProps = {
    format: DesignFormat
    background: string
    onFormat: (next: DesignFormat) => void
    onBackground: (next: string) => void
}

const FormatControls: React.FC<FormatControlsProps> = ({ format, background, onFormat, onBackground }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            <select
                className="ed-select"
                aria-label={k.formatLabel}
                value={format}
                onChange={(event) => onFormat(event.target.value as DesignFormat)}
            >
                {DESIGN_FORMATS.map((entry) => (
                    <option key={entry} value={entry}>{k.formats[entry]}</option>
                ))}
            </select>
            <input
                type="color"
                className="ed-swatch ed-swatch--small"
                aria-label={k.backgroundLabel}
                title={k.backgroundLabel}
                value={background}
                onChange={(event) => onBackground(event.target.value)}
            />
        </>
    )
}

type FrameTemplateEditorProps = {
    template: FrameTemplate
    onDone: () => void
}

const FrameTemplateEditor: React.FC<FrameTemplateEditorProps> = ({ template, onDone }) => {
    const { t } = useStrings()
    const k = t.studio

    const updateFrameTemplate = useStore((state) => state.updateFrameTemplate)

    const [meta, setMeta] = useState({
        name: template.name,
        description: template.description,
        format: template.format,
        background: template.background,
    })
    const [layers, setLayers] = useState<DesignLayer[]>(template.layers)
    const [fields, setFields] = useState<EditableField[]>(() => withUid(template.fields))
    const [selectedId, setSelectedId] = useState<string>(template.layers[0]?.id ?? '')
    const [values, setValues] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [fit, setFit] = useState(0)
    const [panel, setPanel] = useState('layers')
    const [dockOpen, setDockOpen] = useState(false)

    const svgRef = useRef<SVGSVGElement>(null)
    const [sources, setSources] = useState<DesignSourceInfo[]>([])

    useEffect(() => {
        let cancelled = false
        void DesignService.getInstance()
            .listSources()
            .then((catalog) => {
                if (!cancelled) setSources(catalog)
            })
            .catch(() => undefined)
        return () => {
            cancelled = true
        }
    }, [])

    const preview = useMemo<FrameTemplate>(
        () => ({ ...template, ...meta, layers, fields }),
        [template, meta, layers, fields]
    )

    const selected = layers.find((layer) => layer.id === selectedId) ?? null
    const size = DESIGN_FORMAT_SIZES[meta.format]

    const selectLayer = (id: string) => {
        setSelectedId(id)
        if (!id) return
        setPanel('layer')
        setDockOpen(true)
    }

    const patchLayer = (id: string, patch: Partial<DesignLayer>) => {
        setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)))
    }

    const addLayer = (kind: DesignLayerKind) => {
        if (layers.length >= DESIGN_LAYER_LIMIT) return
        const layer: DesignLayer = { id: newId(), ...designLayerDefaults(kind) }
        setLayers((current) => [...current, layer])
        selectLayer(layer.id)
    }

    const duplicateLayer = (id: string) => {
        if (layers.length >= DESIGN_LAYER_LIMIT) return
        const source = layers.find((layer) => layer.id === id)
        if (!source) return
        const copy: DesignLayer = { ...source, id: newId(), x: source.x + 2, y: source.y + 2 }
        setLayers((current) => [...current, copy])
        selectLayer(copy.id)
    }

    const removeLayer = (id: string) => {
        setLayers((current) => current.filter((layer) => layer.id !== id))
        if (selectedId === id) setSelectedId('')
    }

    const moveLayer = (id: string, direction: -1 | 1) => {
        setLayers((current) => {
            const index = current.findIndex((layer) => layer.id === id)
            const target = index + direction
            if (index < 0 || target < 0 || target >= current.length) return current
            const next = [...current]
            const [moved] = next.splice(index, 1)
            next.splice(target, 0, moved)
            return next
        })
    }

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        try {
            const saved = await updateFrameTemplate(template.id, {
                ...meta,
                layers,
                fields: fields.map(({ uid, ...field }) => field),
            })
            if (saved) onDone()
        } finally {
            setSaving(false)
        }
    }

    const handleExport = async () => {
        if (!svgRef.current) return
        await downloadSvgAsPng(svgRef.current, size.width, size.height, meta.name || 'frame')
    }

    const handleUpload = async (key: string, file: File | undefined) => {
        if (!file) return
        const dataUrl = await fileToDataUrl(file)
        setValues((current) => ({ ...current, [key]: dataUrl }))
    }

    useEditorShortcuts({
        hasSelection: Boolean(selected),
        onSave: () => void handleSave(),
        onZoom: setZoom,
        onDeselect: () => setSelectedId(''),
        onDuplicate: () => {
            if (selected) duplicateLayer(selected.id)
        },
        onDelete: () => {
            if (selected) removeLayer(selected.id)
        },
        onNudge: (deltaX, deltaY) => {
            if (!selected) return
            patchLayer(selected.id, {
                x: Math.round((selected.x + deltaX) * 10) / 10,
                y: Math.round((selected.y + deltaY) * 10) / 10,
            })
        },
    })

    const panels: EditorPanel[] = [
        {
            id: 'layers',
            label: k.panelLayers,
            content: (
                <LayersPanel
                    layers={layers}
                    fields={fields}
                    selectedId={selectedId}
                    onSelect={selectLayer}
                    onMove={moveLayer}
                    onDuplicate={duplicateLayer}
                    onRemove={removeLayer}
                />
            ),
        },
        {
            id: 'layer',
            label: k.panelLayer,
            content: (
                <LayerPanel
                    layer={selected}
                    fields={fields}
                    onPatch={(patch) => {
                        if (selected) patchLayer(selected.id, patch)
                    }}
                />
            ),
        },
        {
            id: 'fields',
            label: k.panelFields,
            content: (
                <FieldsPanel
                    fields={fields}
                    sources={sources}
                    boundKey={selected?.field ?? ''}
                    onAdd={() =>
                        setFields((current) => [
                            ...current,
                            {
                                uid: newId(),
                                key: `field_${current.length + 1}`,
                                label: `Field ${current.length + 1}`,
                                kind: 'text' as const,
                                sample: '',
                                source: '',
                                sourceField: '',
                            },
                        ])
                    }
                    onPatch={(uid, patch) =>
                        setFields((current) =>
                            current.map((field) => (field.uid === uid ? { ...field, ...patch } : field))
                        )
                    }
                    onRemove={(uid) => setFields((current) => current.filter((field) => field.uid !== uid))}
                />
            ),
        },
        {
            id: 'fill',
            label: k.panelFill,
            content: (
                <FillPanel
                    fields={fields}
                    values={values}
                    onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
                    onUpload={(key, file) => void handleUpload(key, file)}
                />
            ),
        },
        {
            id: 'setup',
            label: k.panelSetup,
            content: (
                <SetupPanel
                    name={meta.name}
                    description={meta.description}
                    format={meta.format}
                    background={meta.background}
                    onPatch={(patch) => setMeta((current) => ({ ...current, ...patch }))}
                />
            ),
        },
    ]

    return (
        <div className="module module-studio-editor">
            <EditorShell
                title={meta.name}
                titleLabel={k.nameLabel}
                onTitleChange={(name) => setMeta((current) => ({ ...current, name }))}
                onBack={onDone}
                backLabel={k.back}
                toolsLabel={k.toolsTitle}
                tools={<ToolRail onAdd={addLayer} />}
                meta={
                    <FormatControls
                        format={meta.format}
                        background={meta.background}
                        onFormat={(format) => setMeta((current) => ({ ...current, format }))}
                        onBackground={(background) => setMeta((current) => ({ ...current, background }))}
                    />
                }
                actions={
                    <>
                        <button type="button" className="ed-btn" onClick={() => void handleExport()}>
                            <tc-icon name="Download" size="14" decorative></tc-icon>
                            <span className="ed-btn__word">{k.exportPng}</span>
                        </button>
                        <button
                            type="button"
                            className="ed-btn ed-btn--primary"
                            disabled={saving}
                            onClick={() => void handleSave()}
                        >
                            {k.save}
                        </button>
                    </>
                }
                panels={panels}
                activePanel={panel}
                onPanelChange={setPanel}
                dockOpen={dockOpen}
                onDockOpenChange={setDockOpen}
                dockToggleLabel={dockOpen ? k.dockCollapse : k.dockExpand}
                status={
                    <>
                        <EditorZoom zoom={zoom} fit={fit} onZoom={setZoom} onFitZoom={() => setZoom(1)} />
                        <span className="ed-status__item">{k.canvasSize(size.width, size.height)}</span>
                        <span className="ed-status__item">{k.layerCount(layers.length)}</span>
                        <span className="ed-status__hint">{k.shortcuts}</span>
                    </>
                }
            >
                <DesignArtboard
                    ref={svgRef}
                    template={preview}
                    values={values}
                    zoom={zoom}
                    onFit={setFit}
                    selectedId={selectedId}
                    onSelect={selectLayer}
                    onGeometry={(id, geometry) => patchLayer(id, geometry)}
                    onDropLayer={(kind, x, y) => {
                        if (layers.length >= DESIGN_LAYER_LIMIT) return
                        const defaults = designLayerDefaults(kind)
                        const layer: DesignLayer = {
                            id: newId(),
                            ...defaults,
                            x: Math.max(0, x - defaults.width / 2),
                            y: Math.max(0, y - defaults.height / 2),
                        }
                        setLayers((current) => [...current, layer])
                        selectLayer(layer.id)
                    }}
                />
            </EditorShell>
        </div>
    )
}

export default FrameTemplateEditor
