import React, { useMemo, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import DesignCanvas from 'components/DesignCanvas'
import EditorShell, { EditorPanel } from 'components/EditorShell'
import EditorZoom from 'components/EditorZoom'
import EditorStage from 'components/EditorStage'
import { downloadFramesAsVideo, DesignRecordingStalled } from 'helpers/designExport'
import {
    FrameTemplate,
    DESIGN_DURATION_BOUNDS,
    DESIGN_FORMAT_SIZES,
    DESIGN_FRAME_LIMIT,
    DESIGN_TRANSITIONS,
    DesignTransition,
    VideoTemplate,
    designTotalMs,
} from 'types'

type DraftFrame = {
    key: string
    frameTemplateId: string
    durationMs: number
    transition: DesignTransition
    values: Record<string, string>
}

const CLIP_BASE_WIDTH = 34
const CLIP_WIDTH_PER_SECOND = 16

const newKey = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random())

const seconds = (ms: number): string => (ms / 1000).toFixed(1).replace(/\.0$/, '')

const clipWidth = (durationMs: number): number =>
    Math.round(CLIP_BASE_WIDTH + (durationMs / 1000) * CLIP_WIDTH_PER_SECOND)

const toDurationMs = (raw: string, fallback: number): number => {
    if (raw.trim() === '') return fallback
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(
        DESIGN_DURATION_BOUNDS.max,
        Math.max(DESIGN_DURATION_BOUNDS.min, Math.round(parsed * 1000))
    )
}

type ClipPanelProps = {
    entry: DraftFrame | null
    frame: FrameTemplate | null
    index: number
    count: number
    onPatch: (patch: Partial<DraftFrame>) => void
    onMove: (direction: -1 | 1) => void
    onRemove: () => void
}

const ClipPanel: React.FC<ClipPanelProps> = ({ entry, frame, index, count, onPatch, onMove, onRemove }) => {
    const { t } = useStrings()
    const k = t.studio

    if (!entry || !frame) return <p className="ed-panel__empty">{k.noClipSelected}</p>

    return (
        <>
            <div className="ed-panel__head">
                <span className="ed__caps">{k.frameStep(index + 1, count)}</span>
                <span className="ed-layer__tools">
                    <button
                        type="button"
                        className="ed-layer__tool"
                        aria-label={k.layerUp}
                        title={k.layerUp}
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                    >
                        <tc-icon name="ChevronLeft" size="14" decorative></tc-icon>
                    </button>
                    <button
                        type="button"
                        className="ed-layer__tool"
                        aria-label={k.layerDown}
                        title={k.layerDown}
                        disabled={index === count - 1}
                        onClick={() => onMove(1)}
                    >
                        <tc-icon name="ChevronRight" size="14" decorative></tc-icon>
                    </button>
                    <button
                        type="button"
                        className="ed-layer__tool"
                        aria-label={k.delete}
                        title={k.delete}
                        onClick={onRemove}
                    >
                        <tc-icon name="Trash2" size="13" decorative></tc-icon>
                    </button>
                </span>
            </div>

            <div className="ed-grid">
                <label className="ed-field">
                    <span className="ed-field__label">{k.durationLabel}</span>
                    <input
                        type="number"
                        className="ed-input ed-input--num"
                        step="0.5"
                        min={DESIGN_DURATION_BOUNDS.min / 1000}
                        max={DESIGN_DURATION_BOUNDS.max / 1000}
                        value={entry.durationMs / 1000}
                        onChange={(event) =>
                            onPatch({ durationMs: toDurationMs(event.target.value, entry.durationMs) })
                        }
                    />
                </label>

                {index < count - 1 ? (
                    <label className="ed-field">
                        <span className="ed-field__label">{k.transitionLabel}</span>
                        <select
                            className="ed-select"
                            value={entry.transition}
                            onChange={(event) => onPatch({ transition: event.target.value as DesignTransition })}
                        >
                            {DESIGN_TRANSITIONS.map((transition) => (
                                <option key={transition} value={transition}>{k.transitions[transition]}</option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <p className="ed-hint">{k.transitionLast}</p>
                )}
            </div>

            {frame.fields.length > 0 && (
                <div className="ed-panel__group">
                    <span className="ed__caps">{k.frameValues}</span>
                    {frame.fields.flatMap((field) =>
                        field.kind === 'image'
                            ? []
                            : [
                                <label key={field.key} className="ed-field">
                                    <span className="ed-field__label">{field.label}</span>
                                    <input
                                        type="text"
                                        className="ed-input"
                                        placeholder={field.sample}
                                        value={entry.values[field.key] ?? ''}
                                        onChange={(event) =>
                                            onPatch({
                                                values: { ...entry.values, [field.key]: event.target.value },
                                            })
                                        }
                                    />
                                </label>,
                            ]
                    )}
                </div>
            )}
        </>
    )
}

type SetupPanelProps = {
    name: string
    description: string
    onName: (next: string) => void
    onDescription: (next: string) => void
}

const SetupPanel: React.FC<SetupPanelProps> = ({ name, description, onName, onDescription }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            <label className="ed-field">
                <span className="ed-field__label">{k.nameLabel}</span>
                <input type="text" className="ed-input" value={name} onChange={(event) => onName(event.target.value)} />
            </label>

            <label className="ed-field">
                <span className="ed-field__label">{k.descriptionLabel}</span>
                <input
                    type="text"
                    className="ed-input"
                    value={description}
                    onChange={(event) => onDescription(event.target.value)}
                />
            </label>

            <p className="ed-hint">{k.formatLocked}</p>
            <p className="ed-hint">{k.recordHint}</p>
        </>
    )
}

type VideoTemplateEditorProps = {
    template: VideoTemplate
    frames: FrameTemplate[]
    onDone: () => void
}

const VideoTemplateEditor: React.FC<VideoTemplateEditorProps> = ({ template, frames, onDone }) => {
    const { t } = useStrings()
    const k = t.studio

    const updateVideoTemplate = useStore((state) => state.updateVideoTemplate)
    const addAlert = useStore((state) => state.addAlert)

    const [name, setName] = useState(template.name)
    const [description, setDescription] = useState(template.description)
    const [sequence, setSequence] = useState<DraftFrame[]>(() =>
        template.frames.map((frame) => ({
            key: frame.id,
            frameTemplateId: frame.frameTemplateId,
            durationMs: frame.durationMs,
            transition: frame.transition,
            values: frame.values ?? {},
        }))
    )
    const [saving, setSaving] = useState(false)
    const [recording, setRecording] = useState(false)
    const [selectedKey, setSelectedKey] = useState(template.frames[0]?.id ?? '')
    const [zoom, setZoom] = useState(1)
    const [fit, setFit] = useState(0)
    const [panel, setPanel] = useState('clip')
    const [dockOpen, setDockOpen] = useState(true)

    const svgRefs = useRef<Array<SVGSVGElement | null>>([])

    const format = sequence.length > 0
        ? frames.find((frame) => frame.id === sequence[0].frameTemplateId)?.format ?? template.format
        : template.format

    const eligible = useMemo(
        () => (sequence.length === 0 ? frames : frames.filter((frame) => frame.format === format)),
        [frames, sequence.length, format]
    )

    const resolved = useMemo(
        () =>
            sequence.flatMap((entry) => {
                const frame = frames.find((candidate) => candidate.id === entry.frameTemplateId)
                return frame ? [{ entry, frame }] : []
            }),
        [sequence, frames]
    )

    const totalMs = designTotalMs(sequence)
    const size = DESIGN_FORMAT_SIZES[format]

    const selectedIndex = resolved.findIndex(({ entry }) => entry.key === selectedKey)
    const current = selectedIndex >= 0 ? resolved[selectedIndex] : resolved[0] ?? null
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0

    const patchFrame = (key: string, patch: Partial<DraftFrame>) => {
        setSequence((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)))
    }

    const moveFrame = (key: string, direction: -1 | 1) => {
        setSequence((current) => {
            const index = current.findIndex((entry) => entry.key === key)
            const target = index + direction
            if (index < 0 || target < 0 || target >= current.length) return current
            const next = [...current]
            const [moved] = next.splice(index, 1)
            next.splice(target, 0, moved)
            return next
        })
    }

    const addFrame = (frameTemplateId: string) => {
        if (!frameTemplateId || sequence.length >= DESIGN_FRAME_LIMIT) return
        const entry: DraftFrame = {
            key: newKey(),
            frameTemplateId,
            durationMs: DESIGN_DURATION_BOUNDS.default,
            transition: 'fade',
            values: {},
        }
        setSequence((current) => [...current, entry])
        setSelectedKey(entry.key)
    }

    const handleSave = async () => {
        if (saving) return
        if (sequence.length === 0) {
            addAlert({ variant: 'danger', message: k.videoNeedsFrames, dismissible: true })
            return
        }
        setSaving(true)
        try {
            const saved = await updateVideoTemplate(template.id, {
                name,
                description,
                format,
                frames: sequence.map((entry) => ({
                    frameTemplateId: entry.frameTemplateId,
                    durationMs: entry.durationMs,
                    transition: entry.transition,
                    values: entry.values,
                })),
            })
            if (saved) onDone()
        } finally {
            setSaving(false)
        }
    }

    const handleRecord = async () => {
        if (recording) return
        if (resolved.length < 2) {
            addAlert({ variant: 'danger', message: k.videoNeedsTwo, dismissible: true })
            return
        }
        const svgs = svgRefs.current.slice(0, resolved.length).filter(Boolean) as SVGSVGElement[]
        if (svgs.length !== resolved.length) return

        setRecording(true)
        try {
            await downloadFramesAsVideo(
                svgs,
                size.width,
                size.height,
                resolved.map(({ entry }) => entry.durationMs),
                resolved.map(({ entry }) => entry.transition),
                name || 'video'
            )
        } catch (error) {
            addAlert({
                variant: 'danger',
                message:
                    error instanceof DesignRecordingStalled
                        ? k.recordStalled
                        : error instanceof Error
                          ? error.message
                          : k.recordUnsupported,
                dismissible: true,
            })
        } finally {
            setRecording(false)
        }
    }

    const panels: EditorPanel[] = [
        {
            id: 'clip',
            label: k.panelClip,
            content: (
                <ClipPanel
                    entry={current?.entry ?? null}
                    frame={current?.frame ?? null}
                    index={currentIndex}
                    count={resolved.length}
                    onPatch={(patch) => {
                        if (current) patchFrame(current.entry.key, patch)
                    }}
                    onMove={(direction) => {
                        if (current) moveFrame(current.entry.key, direction)
                    }}
                    onRemove={() => {
                        if (!current) return
                        setSequence((entries) => entries.filter((entry) => entry.key !== current.entry.key))
                        setSelectedKey('')
                    }}
                />
            ),
        },
        {
            id: 'setup',
            label: k.panelSetup,
            content: (
                <SetupPanel name={name} description={description} onName={setName} onDescription={setDescription} />
            ),
        },
    ]

    return (
        <div className="module module-studio-composer">
            <EditorShell
                title={name}
                titleLabel={k.nameLabel}
                onTitleChange={setName}
                onBack={onDone}
                backLabel={k.back}
                actions={
                    <>
                        <button
                            type="button"
                            className="ed-btn"
                            disabled={recording || resolved.length < 2}
                            onClick={() => void handleRecord()}
                        >
                            <tc-icon name="Clapperboard" size="14" decorative></tc-icon>
                            <span className="ed-btn__word">{recording ? k.recording : k.exportVideo}</span>
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
                footer={
                    <div className="ed-timeline">
                        {resolved.length === 0 ? (
                            <span className="ed-timeline__empty">{k.sequenceEmpty}</span>
                        ) : (
                            resolved.map(({ entry, frame }, index) => (
                                <button
                                    key={entry.key}
                                    type="button"
                                    className="ed-timeline__clip"
                                    style={{ width: `${clipWidth(entry.durationMs)}px` }}
                                    title={`${frame.name} · ${k.duration(seconds(entry.durationMs))}`}
                                    data-selected={entry.key === current?.entry.key ? 'true' : undefined}
                                    onClick={() => {
                                        setSelectedKey(entry.key)
                                        setPanel('clip')
                                        setDockOpen(true)
                                    }}
                                >
                                    <span className="ed-timeline__thumb">
                                        <DesignCanvas template={frame} values={entry.values} />
                                    </span>
                                    <span className="ed-timeline__meta">
                                        <span>{index + 1}</span>
                                        <span>{k.duration(seconds(entry.durationMs))}</span>
                                    </span>
                                </button>
                            ))
                        )}

                        <label className="ed-timeline__add">
                            <span className="ed__caps">{k.addFrame}</span>
                            <select
                                className="ed-select"
                                aria-label={k.addFrame}
                                value=""
                                disabled={sequence.length >= DESIGN_FRAME_LIMIT}
                                onChange={(event) => addFrame(event.target.value)}
                            >
                                <option value="">{k.pickFrame}</option>
                                {eligible.map((frame) => (
                                    <option key={frame.id} value={frame.id}>{frame.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                }
                status={
                    <>
                        {current && (
                            <EditorZoom zoom={zoom} fit={fit} onZoom={setZoom} onFitZoom={() => setZoom(1)} />
                        )}
                        <span className="ed-status__item">{k.frameCount(sequence.length)}</span>
                        <span className="ed-status__item">{k.totalDuration(seconds(totalMs))}</span>
                        <span className="ed-status__hint">{k.timelineHint}</span>
                    </>
                }
            >
                {current && (
                    <EditorStage width={size.width} height={size.height} zoom={zoom} onFit={setFit} className="ed-stage__art">
                        <DesignCanvas template={current.frame} values={current.entry.values} />
                    </EditorStage>
                )}

                <div className="ed-offscreen" aria-hidden="true">
                    {resolved.map(({ entry, frame }, index) => (
                        <DesignCanvas
                            key={`export-${entry.key}`}
                            ref={(element: SVGSVGElement | null) => {
                                svgRefs.current[index] = element
                            }}
                            template={frame}
                            values={entry.values}
                        />
                    ))}
                </div>
            </EditorShell>
        </div>
    )
}

export default VideoTemplateEditor
