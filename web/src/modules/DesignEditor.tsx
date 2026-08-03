import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import useFeature from 'hooks/useFeature'
import DesignCanvas from 'components/DesignCanvas'
import EditorShell, { EditorPanel } from 'components/EditorShell'
import EditorZoom from 'components/EditorZoom'
import EditorStage from 'components/EditorStage'
import DesignService from 'services/DesignService'
import { downloadFramesAsVideo, DesignRecordingStalled, svgToPngBlob, fileToDataUrl } from 'helpers/designExport'
import { downloadSvgAsPng } from 'helpers/designExport'
import {
    FrameTemplate,
    DESIGN_FORMAT_SIZES,
    Design,
    DesignSourceInfo,
    DesignSourceItem,
    VideoTemplate,
} from 'types'

type SourcePicker = {
    source: DesignSourceInfo
    items: DesignSourceItem[]
}

type ExportArgs = {
    name: string
    resolved: Array<{ frame: FrameTemplate }>
    svgRefs: React.MutableRefObject<Array<SVGSVGElement | null>>
    video: VideoTemplate | null
    busy: boolean
    setBusy: (value: boolean) => void
    onFileSaved: (fileId: string) => Promise<void>
    onError: (message: string) => void
}

const useDesignExports = ({ name, resolved, svgRefs, video, busy, setBusy, onFileSaved, onError }: ExportArgs) => {
    const { t } = useStrings()
    const k = t.studio

    const sizeOf = () => DESIGN_FORMAT_SIZES[resolved[0].frame.format]

    const exportPng = async () => {
        const svg = svgRefs.current[0]
        if (!svg) return
        const size = sizeOf()
        await downloadSvgAsPng(svg, size.width, size.height, name || 'design')
    }

    const saveToFiles = async () => {
        const svg = svgRefs.current[0]
        if (!svg || busy) return
        setBusy(true)
        try {
            const size = sizeOf()
            const blob = await svgToPngBlob(svg, size.width, size.height)
            const stored = await DesignService.getInstance().saveRenderFile(blob, `${name || 'design'}.png`)
            await onFileSaved(stored.id)
        } catch (error) {
            onError(error instanceof Error ? error.message : k.saveFailed)
        } finally {
            setBusy(false)
        }
    }

    const exportVideo = async () => {
        if (busy || !video) return
        const svgs = svgRefs.current.slice(0, resolved.length).filter(Boolean) as SVGSVGElement[]
        if (svgs.length !== resolved.length || svgs.length < 2) return

        setBusy(true)
        try {
            const size = sizeOf()
            await downloadFramesAsVideo(
                svgs,
                size.width,
                size.height,
                video.frames.map((frame) => frame.durationMs),
                video.frames.map((frame) => frame.transition),
                name || 'design'
            )
        } catch (error) {
            onError(
                error instanceof DesignRecordingStalled
                    ? k.recordStalled
                    : error instanceof Error
                      ? error.message
                      : k.recordUnsupported
            )
        } finally {
            setBusy(false)
        }
    }

    return { exportPng, saveToFiles, exportVideo }
}

type SourcePanelProps = {
    pickers: SourcePicker[]
    onPick: (sourceId: string, itemId: string) => void
}

const SourcePanel: React.FC<SourcePanelProps> = ({ pickers, onPick }) => {
    const { t } = useStrings()
    const k = t.studio

    if (pickers.length === 0) return <p className="ed-panel__empty">{k.sourceHint}</p>

    return (
        <>
            <p className="ed-hint">{k.sourceHint}</p>
            {pickers.map((picker) => (
                <label key={picker.source.id} className="ed-field">
                    <span className="ed-field__label">{picker.source.label}</span>
                    <select
                        className="ed-select"
                        defaultValue=""
                        onChange={(event) => onPick(picker.source.id, event.target.value)}
                    >
                        <option value="">{k.sourcePick(picker.source.label)}</option>
                        {picker.items.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                    </select>
                </label>
            ))}
        </>
    )
}

type FillPanelProps = {
    frame: FrameTemplate
    values: Record<string, string>
    position: number
    total: number
    onChange: (key: string, value: string) => void
    onUpload: (key: string, file: File | undefined) => void
}

const FillPanel: React.FC<FillPanelProps> = ({ frame, values, position, total, onChange, onUpload }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            {total > 1 && <span className="ed__caps">{k.frameStep(position, total)}</span>}
            <p className="ed-hint">{k.renderContentHint}</p>

            {frame.fields.length === 0 ? (
                <p className="ed-panel__empty">{k.fieldsHint}</p>
            ) : (
                frame.fields.map((field) => (
                    <label key={field.key} className="ed-field">
                        <span className="ed-field__label">
                            {field.label}
                            {field.source ? ` · ${field.source}.${field.sourceField}` : ''}
                        </span>
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
                                placeholder={field.sample}
                                value={values[field.key] ?? ''}
                                onChange={(event) => onChange(field.key, event.target.value)}
                            />
                        ) : (
                            <input
                                type="text"
                                className="ed-input"
                                placeholder={field.sample}
                                value={values[field.key] ?? ''}
                                onChange={(event) => onChange(field.key, event.target.value)}
                            />
                        )}
                    </label>
                ))
            )}
        </>
    )
}

type OutputPanelProps = {
    name: string
    fileId: string | null
    filesEnabled: boolean
    isFrame: boolean
    onNameChange: (next: string) => void
}

const OutputPanel: React.FC<OutputPanelProps> = ({ name, fileId, filesEnabled, isFrame, onNameChange }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <>
            <label className="ed-field">
                <span className="ed-field__label">{k.nameLabel}</span>
                <input
                    type="text"
                    className="ed-input"
                    value={name}
                    onChange={(event) => onNameChange(event.target.value)}
                />
            </label>

            {!filesEnabled && isFrame && <p className="ed-hint">{k.filesDisabled}</p>}

            {fileId && (
                <p className="ed-hint">
                    {k.savedFile}:{' '}
                    <a href={`/api/files/${fileId}`} target="_blank" rel="noopener noreferrer">
                        {name || fileId}
                    </a>
                </p>
            )}

            {!isFrame && <p className="ed-hint">{k.recordHint}</p>}
        </>
    )
}

type FrameStripProps = {
    entries: Array<{ uid: string; frame: FrameTemplate; values: Record<string, string> }>
    active: number
    onPick: (index: number) => void
}

const FrameStrip: React.FC<FrameStripProps> = ({ entries, active, onPick }) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <div className="ed-strip">
            {entries.map((entry, index) => (
                <button
                    key={entry.uid}
                    type="button"
                    className="ed-strip__frame"
                    aria-label={k.frameStep(index + 1, entries.length)}
                    title={entry.frame.name}
                    data-selected={index === active ? 'true' : undefined}
                    onClick={() => onPick(index)}
                >
                    <DesignCanvas template={entry.frame} values={entry.values} />
                </button>
            ))}
        </div>
    )
}

type DesignEditorProps = {
    render: Design
    frames: FrameTemplate[]
    videos: VideoTemplate[]
    onDone: () => void
}

const DesignEditor: React.FC<DesignEditorProps> = ({ render, frames, videos, onDone }) => {
    const { t } = useStrings()
    const k = t.studio

    const updateDesign = useStore((state) => state.updateDesign)
    const addAlert = useStore((state) => state.addAlert)

    const filesEnabled = useFeature('files')
    const canUpload = useCan('file.upload')

    const [name, setName] = useState(render.name)
    const [entries, setEntries] = useState(() =>
        render.entries.map((entry, index) => ({
            ...entry,
            uid: `${entry.frameTemplateId}-${index}`,
            values: { ...entry.values },
        }))
    )
    const [fileId, setFileId] = useState(render.fileId)
    const [pickers, setPickers] = useState<SourcePicker[]>([])
    const [busy, setBusy] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [fit, setFit] = useState(0)
    const [active, setActive] = useState(0)
    const [panel, setPanel] = useState('fill')
    const [dockOpen, setDockOpen] = useState(true)

    const svgRefs = useRef<Array<SVGSVGElement | null>>([])

    const framesById = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames])

    const resolved = useMemo(
        () =>
            entries.flatMap((entry) => {
                const frame = framesById.get(entry.frameTemplateId)
                return frame ? [{ entry, frame }] : []
            }),
        [entries, framesById]
    )

    const video = render.videoTemplateId
        ? videos.find((candidate) => candidate.id === render.videoTemplateId) ?? null
        : null

    const boundSources = useMemo(() => {
        const ids = new Set<string>()
        for (const { frame } of resolved) {
            for (const field of frame.fields) {
                if (field.source) ids.add(field.source)
            }
        }
        return ids
    }, [resolved])

    useEffect(() => {
        if (boundSources.size === 0) {
            setPickers([])
            return
        }
        let cancelled = false
        const load = async () => {
            try {
                const catalog = await DesignService.getInstance().listSources()
                const wanted = catalog.filter((source) => boundSources.has(source.id))
                const loaded = await Promise.all(
                    wanted.map(async (source) => ({
                        source,
                        items: await DesignService.getInstance().listSourceItems(source.id),
                    }))
                )
                if (!cancelled) setPickers(loaded)
            } catch {
                if (!cancelled) setPickers([])
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [boundSources])

    const setValue = (uid: string, key: string, value: string) => {
        setEntries((current) =>
            current.map((entry) =>
                entry.uid === uid ? { ...entry, values: { ...entry.values, [key]: value } } : entry
            )
        )
    }

    const applySource = async (sourceId: string, itemId: string) => {
        if (!itemId) return
        try {
            const data = await DesignService.getInstance().resolveSource(sourceId, itemId)
            setEntries((current) =>
                current.map((entry) => {
                    const frame = framesById.get(entry.frameTemplateId)
                    if (!frame) return entry
                    const values = { ...entry.values }
                    for (const field of frame.fields) {
                        if (field.source !== sourceId) continue
                        const next = data[field.sourceField]
                        if (next !== undefined) values[field.key] = next
                    }
                    return { ...entry, values }
                })
            )
        } catch (error) {
            addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : k.saveFailed,
                dismissible: true,
            })
        }
    }

    const handleUpload = async (uid: string, key: string, file: File | undefined) => {
        if (!file) return
        const dataUrl = await fileToDataUrl(file)
        setValue(uid, key, dataUrl)
    }

    const persist = async (nextFileId: string | null) => {
        return updateDesign(render.id, {
            name,
            entries: entries.map((entry) => ({ frameTemplateId: entry.frameTemplateId, values: entry.values })),
            fileId: nextFileId,
        })
    }

    const handleSave = async () => {
        if (busy) return
        setBusy(true)
        try {
            const saved = await persist(fileId)
            if (saved) onDone()
        } finally {
            setBusy(false)
        }
    }

    const { exportPng, saveToFiles, exportVideo } = useDesignExports({
        name,
        resolved,
        svgRefs,
        video,
        busy,
        setBusy,
        onFileSaved: async (storedId) => {
            setFileId(storedId)
            await persist(storedId)
            addAlert({ variant: 'success', message: k.savedToFiles, dismissible: true })
        },
        onError: (message) => addAlert({ variant: 'danger', message, dismissible: true }),
    })

    const current = resolved[Math.min(active, Math.max(0, resolved.length - 1))] ?? null
    const size = DESIGN_FORMAT_SIZES[current?.frame.format ?? 'story']

    const panels: EditorPanel[] = [
        {
            id: 'fill',
            label: k.panelFill,
            content: current ? (
                <FillPanel
                    frame={current.frame}
                    values={current.entry.values}
                    position={active + 1}
                    total={resolved.length}
                    onChange={(key, value) => setValue(current.entry.uid, key, value)}
                    onUpload={(key, file) => void handleUpload(current.entry.uid, key, file)}
                />
            ) : (
                <p className="ed-panel__empty">{k.rendersEmptyHint}</p>
            ),
        },
        {
            id: 'data',
            label: k.sourceTitle,
            content: <SourcePanel pickers={pickers} onPick={(sourceId, itemId) => void applySource(sourceId, itemId)} />,
        },
        {
            id: 'output',
            label: k.panelOutput,
            content: (
                <OutputPanel
                    name={name}
                    fileId={fileId}
                    filesEnabled={filesEnabled}
                    isFrame={render.kind === 'frame'}
                    onNameChange={setName}
                />
            ),
        },
    ]

    return (
        <div className="module module-studio-render">
            <EditorShell
                title={name}
                titleLabel={k.nameLabel}
                onTitleChange={setName}
                onBack={onDone}
                backLabel={k.back}
                actions={
                    <>
                        {render.kind === 'frame' ? (
                            <>
                                <button type="button" className="ed-btn" onClick={() => void exportPng()}>
                                    <tc-icon name="Download" size="14" decorative></tc-icon>
                                    <span className="ed-btn__word">{k.exportPng}</span>
                                </button>
                                {filesEnabled && canUpload && (
                                    <button
                                        type="button"
                                        className="ed-btn"
                                        disabled={busy}
                                        onClick={() => void saveToFiles()}
                                    >
                                        {k.saveToFiles}
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                type="button"
                                className="ed-btn"
                                disabled={busy || resolved.length < 2}
                                onClick={() => void exportVideo()}
                            >
                                <tc-icon name="Clapperboard" size="14" decorative></tc-icon>
                                <span className="ed-btn__word">{k.exportVideo}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className="ed-btn ed-btn--primary"
                            disabled={busy}
                            onClick={() => void handleSave()}
                        >
                            {k.saveDesign}
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
                    resolved.length > 1 && (
                        <FrameStrip
                            entries={resolved.map(({ entry, frame }) => ({
                                uid: entry.uid,
                                frame,
                                values: entry.values,
                            }))}
                            active={active}
                            onPick={setActive}
                        />
                    )
                }
                status={
                    <>
                        {current && (
                            <EditorZoom zoom={zoom} fit={fit} onZoom={setZoom} onFitZoom={() => setZoom(1)} />
                        )}
                        <span className="ed-status__item">{k.canvasSize(size.width, size.height)}</span>
                        <span className="ed-status__item">{render.templateName}</span>
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
                            key={`export-${entry.uid}`}
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

export default DesignEditor
