import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan, { useResourceLimits } from 'hooks/useCan'
import { useLimitLock } from 'hooks/useLock'
import { DESIGN_LIMIT_ENTITLEMENT, DESIGN_TEMPLATE_LIMIT_ENTITLEMENT } from 'configs/entitlements'
import LimitMeter from 'components/LimitMeter'
import LockedAction from 'components/LockedAction'
import RouteTabs, { RouteTab } from 'components/RouteTabs'
import { MODAL, useModalOpen } from 'modals'
import { PickTemplateInput, PickTemplateResult } from 'modals/PickTemplateModal'
import DesignCanvas from 'components/DesignCanvas'
import FrameTemplateEditor from 'modules/FrameTemplateEditor'
import VideoTemplateEditor from 'modules/VideoTemplateEditor'
import DesignEditor from 'modules/DesignEditor'
import { FrameTemplate, Design, VideoTemplate } from 'types'

const seconds = (ms: number): string => (ms / 1000).toFixed(1).replace(/\.0$/, '')

type StudioCardProps = {
    name: string
    meta: string
    badge?: string
    icon: string
    canWrite: boolean
    onEdit: () => void
    onDelete: () => void
    children?: React.ReactNode
}

const StudioCard: React.FC<StudioCardProps> = ({
    name,
    meta,
    badge,
    icon,
    canWrite,
    onEdit,
    onDelete,
    children,
}) => {
    const { t } = useStrings()
    const k = t.studio

    return (
        <tc-card className="studio-card">
            <div slot="header" className="studio-card__header">
                <tc-icon-badge glyph={icon}></tc-icon-badge>
                <span className="studio-card__name" title={name}>{name}</span>
            </div>

            {children}

            <tc-text variant="muted" size="sm">{badge ? `${badge} · ${meta}` : meta}</tc-text>

            {canWrite && (
                <div slot="footer" className="studio-card__footer">
                    <tc-button size="sm" variant="secondary" outline onClick={onEdit}>
                        {k.edit}
                    </tc-button>
                    <tc-button size="sm" variant="danger" outline onClick={onDelete}>
                        {k.delete}
                    </tc-button>
                </div>
            )}
        </tc-card>
    )
}

type StudioGridProps = {
    kind: 'frames' | 'videos' | 'designs'
    frameTemplates: FrameTemplate[]
    videoTemplates: VideoTemplate[]
    designs: Design[]
    loaded: boolean
    canWrite: boolean
    onEdit: (id: string) => void
    onDelete: (id: string) => void
}

const StudioGrid: React.FC<StudioGridProps> = ({
    kind,
    frameTemplates,
    videoTemplates,
    designs,
    loaded,
    canWrite,
    onEdit,
    onDelete,
}) => {
    const { t } = useStrings()
    const k = t.studio

    const framesById = useMemo(
        () => new Map(frameTemplates.map((frame) => [frame.id, frame])),
        [frameTemplates]
    )

    if (kind === 'frames') {
        if (loaded && frameTemplates.length === 0) {
            return (
                <tc-empty-state heading={k.framesEmpty} icon="image">
                    <p className="studio-block__hint">{k.framesEmptyHint}</p>
                </tc-empty-state>
            )
        }
        return (
            <div className="studio-grid">
                {frameTemplates.map((frame) => (
                    <StudioCard
                        key={frame.id}
                        name={frame.name}
                        meta={k.layerCount(frame.layers.length)}
                        badge={k.formats[frame.format]}
                        icon="Image"
                        canWrite={canWrite}
                        onEdit={() => onEdit(frame.id)}
                        onDelete={() => onDelete(frame.id)}
                    >
                        <div className="studio-card__thumb">
                            <DesignCanvas template={frame} />
                        </div>
                    </StudioCard>
                ))}
            </div>
        )
    }

    if (kind === 'videos') {
        if (loaded && videoTemplates.length === 0) {
            return (
                <tc-empty-state heading={k.videosEmpty} icon="clapperboard">
                    <p className="studio-block__hint">{k.videosEmptyHint}</p>
                </tc-empty-state>
            )
        }
        return (
            <div className="studio-grid">
                {videoTemplates.map((video) => (
                    <StudioCard
                        key={video.id}
                        name={video.name}
                        meta={`${k.frameCount(video.frames.length)} · ${k.totalDuration(seconds(video.totalMs))}`}
                        badge={k.formats[video.format]}
                        icon="Clapperboard"
                        canWrite={canWrite}
                        onEdit={() => onEdit(video.id)}
                        onDelete={() => onDelete(video.id)}
                    >
                        <div className="studio-card__strip">
                            {video.frames.slice(0, 4).flatMap((frame) => {
                                const source = framesById.get(frame.frameTemplateId)
                                return source
                                    ? [
                                        <div key={frame.id} className="studio-card__thumb">
                                            <DesignCanvas template={source} values={frame.values} />
                                        </div>,
                                    ]
                                    : []
                            })}
                        </div>
                    </StudioCard>
                ))}
            </div>
        )
    }

    if (loaded && designs.length === 0) {
        return (
            <tc-empty-state heading={k.rendersEmpty} icon="sparkles">
                <p className="studio-block__hint">{k.rendersEmptyHint}</p>
            </tc-empty-state>
        )
    }
    return (
        <div className="studio-grid">
            {designs.map((entry) => {
                const first = entry.entries[0]
                const frame = first ? framesById.get(first.frameTemplateId) : undefined
                return (
                    <StudioCard
                        key={entry.id}
                        name={entry.name}
                        meta={`${entry.templateName} · ${k.frameCount(entry.entries.length)}`}
                        badge={entry.fileId ? k.savedFile : undefined}
                        icon="Sparkles"
                        canWrite={canWrite}
                        onEdit={() => onEdit(entry.id)}
                        onDelete={() => onDelete(entry.id)}
                    >
                        {frame && (
                            <div className="studio-card__thumb">
                                <DesignCanvas template={frame} values={first.values} />
                            </div>
                        )}
                    </StudioCard>
                )
            })}
        </div>
    )
}

const DesignStudio: React.FC = () => {
    const { tab } = useParams<{ tab?: string }>()
    const { t } = useStrings()
    const k = t.studio

    const frameTemplates = useStore((state) => state.frameTemplates)
    const frameTemplatesLoaded = useStore((state) => state.frameTemplatesLoaded)
    const videoTemplates = useStore((state) => state.videoTemplates)
    const videoTemplatesLoaded = useStore((state) => state.videoTemplatesLoaded)
    const fetchFrameTemplates = useStore((state) => state.fetchFrameTemplates)
    const fetchVideoTemplates = useStore((state) => state.fetchVideoTemplates)
    const createFrameTemplate = useStore((state) => state.createFrameTemplate)
    const createVideoTemplate = useStore((state) => state.createVideoTemplate)
    const deleteFrameTemplate = useStore((state) => state.deleteFrameTemplate)
    const deleteVideoTemplate = useStore((state) => state.deleteVideoTemplate)
    const designs = useStore((state) => state.designs)
    const designsLoaded = useStore((state) => state.designsLoaded)
    const fetchDesigns = useStore((state) => state.fetchDesigns)
    const createDesign = useStore((state) => state.createDesign)
    const deleteDesign = useStore((state) => state.deleteDesign)

    const canWrite = useCan('design.template.write')

    const [editingFrameId, setEditingFrameId] = useState<string | null>(null)
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null)
    const [editingRenderId, setEditingRenderId] = useState<string | null>(null)

    useEffect(() => {
        void fetchFrameTemplates()
        void fetchVideoTemplates()
        void fetchDesigns()
    }, [fetchFrameTemplates, fetchVideoTemplates, fetchDesigns])

    const limits = useResourceLimits()
    const templatesUsed = frameTemplates.length + videoTemplates.length
    const templateLock = useLimitLock(
        limits.design_templates !== null && templatesUsed >= limits.design_templates,
        DESIGN_TEMPLATE_LIMIT_ENTITLEMENT
    )
    const designLock = useLimitLock(
        limits.designs !== null && designs.length >= limits.designs,
        DESIGN_LIMIT_ENTITLEMENT
    )

    const active = tab === 'videos' ? 'videos' : tab === 'designs' ? 'designs' : 'frames'

    const tabs = useMemo<RouteTab[]>(
        () => [
            { id: 'frames', label: k.tabFrames, icon: 'image', path: '/studio' },
            { id: 'videos', label: k.tabVideos, icon: 'clapperboard', path: '/studio/videos' },
            { id: 'designs', label: k.tabRenders, icon: 'sparkles', path: '/studio/designs' },
        ],
        [k]
    )

    const editingFrame = frameTemplates.find((frame) => frame.id === editingFrameId) ?? null
    const editingVideo = videoTemplates.find((video) => video.id === editingVideoId) ?? null
    const editingRender = designs.find((entry) => entry.id === editingRenderId) ?? null

    const handleNewFrame = async () => {
        const created = await createFrameTemplate({
            name: `${k.newFrame} ${frameTemplates.length + 1}`,
            format: 'story',
            background: '#ffffff',
            fields: [
                { key: 'headline', label: 'Headline', kind: 'text', sample: 'Your headline', source: '', sourceField: '' },
            ],
            layers: [
                {
                    id: 'headline',
                    ...({
                        kind: 'text',
                        x: 10,
                        y: 42,
                        width: 80,
                        height: 16,
                        field: 'headline',
                        text: 'Your headline',
                        font: 'sans',
                        fontSize: 84,
                        fontWeight: 700,
                        align: 'center',
                        lineHeight: 1.2,
                        uppercase: false,
                        letterSpacing: 0,
                        color: '#18181b',
                        opacity: 1,
                        radius: 0,
                        fit: 'cover',
                        gradientTo: '#000000',
                        gradientDirection: 'down',
                        css: '',
                    } as const),
                },
            ],
        })
        if (created) setEditingFrameId(created.id)
    }

    const handleNewVideo = async () => {
        const created = await createVideoTemplate({
            name: `${k.newVideo} ${videoTemplates.length + 1}`,
            format: frameTemplates[0]?.format ?? 'story',
            frames: [],
        })
        if (created) setEditingVideoId(created.id)
    }

    const pickFrameTemplate = useModalOpen<PickTemplateResult, PickTemplateInput>(
        MODAL.PICK_TEMPLATE,
        async (result) => {
            if (!result) return
            const created = await createDesign({ name: result.name, frameTemplateId: result.templateId })
            if (created) setEditingRenderId(created.id)
        }
    )

    const pickVideoTemplate = useModalOpen<PickTemplateResult, PickTemplateInput>(
        MODAL.PICK_TEMPLATE,
        async (result) => {
            if (!result) return
            const created = await createDesign({ name: result.name, videoTemplateId: result.templateId })
            if (created) setEditingRenderId(created.id)
        }
    )

    const handleNewRender = (fromFrame: boolean) => {
        const defaultName = `${k.newRender} ${designs.length + 1}`
        if (fromFrame) {
            pickFrameTemplate({
                kind: 'frame',
                defaultName,
                templates: frameTemplates.map((frame) => ({
                    id: frame.id,
                    name: frame.name,
                    meta: `${k.formats[frame.format]} · ${k.layerCount(frame.layers.length)}`,
                })),
            })
            return
        }
        pickVideoTemplate({
            kind: 'video',
            defaultName,
            templates: videoTemplates.map((video) => ({
                id: video.id,
                name: video.name,
                meta: `${k.formats[video.format]} · ${k.frameCount(video.frames.length)}`,
            })),
        })
    }

    const handleDeleteRender = async (entry: Design) => {
        if (!window.confirm(k.deletePrompt(entry.name))) return
        await deleteDesign(entry.id)
    }

    const handleDeleteFrame = async (frame: FrameTemplate) => {
        if (!window.confirm(k.deletePrompt(frame.name))) return
        await deleteFrameTemplate(frame.id)
    }

    const handleDeleteVideo = async (video: VideoTemplate) => {
        if (!window.confirm(k.deletePrompt(video.name))) return
        await deleteVideoTemplate(video.id)
    }

    if (editingFrame) {
        return <FrameTemplateEditor key={editingFrame.id} template={editingFrame} onDone={() => setEditingFrameId(null)} />
    }

    if (editingRender) {
        return (
            <DesignEditor
                key={editingRender.id}
                render={editingRender}
                frames={frameTemplates}
                videos={videoTemplates}
                onDone={() => setEditingRenderId(null)}
            />
        )
    }

    if (editingVideo) {
        return (
            <VideoTemplateEditor
                key={editingVideo.id}
                template={editingVideo}
                frames={frameTemplates}
                onDone={() => setEditingVideoId(null)}
            />
        )
    }

    return (
        <div className="module module-studio">
            <tc-rich-page-header
                className="module-studio__header"
                title-text={k.title}
                description={k.intro}
                icon-name="Clapperboard"
                icon-color="amber"
            >
                <div slot="chips" className="module-studio__meters">
                    <LimitMeter
                        used={templatesUsed}
                        limit={limits.design_templates}
                        noun="design templates"
                        resource="design_templates"
                        onUpgrade={templateLock.open}
                    />
                    <LimitMeter
                        used={designs.length}
                        limit={limits.designs}
                        noun="designs"
                        resource="designs"
                        onUpgrade={designLock.open}
                    />
                </div>

                {canWrite && (
                    <div slot="actions" className="module-studio__actions">
                        {active === 'designs' ? (
                            <>
                                <LockedAction lock={designLock} onClick={() => handleNewRender(true)}>
                                    <tc-button variant="primary" disabled={frameTemplates.length === 0 || undefined}>
                                        {k.renderFromFrame}
                                    </tc-button>
                                </LockedAction>
                                <LockedAction lock={designLock} onClick={() => handleNewRender(false)}>
                                    <tc-button
                                        variant="secondary"
                                        outline
                                        disabled={videoTemplates.length === 0 || undefined}
                                    >
                                        {k.renderFromVideo}
                                    </tc-button>
                                </LockedAction>
                            </>
                        ) : (
                            <LockedAction
                                lock={templateLock}
                                onClick={() => void (active === 'frames' ? handleNewFrame() : handleNewVideo())}
                            >
                                <tc-button variant="primary">
                                    {active === 'frames' ? k.newFrame : k.newVideo}
                                </tc-button>
                            </LockedAction>
                        )}
                    </div>
                )}
            </tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={active} />

            <div className="module-studio__content">
                <StudioGrid
                    kind={active}
                    frameTemplates={frameTemplates}
                    videoTemplates={videoTemplates}
                    designs={designs}
                    loaded={
                        active === 'frames'
                            ? frameTemplatesLoaded
                            : active === 'videos'
                              ? videoTemplatesLoaded
                              : designsLoaded
                    }
                    canWrite={canWrite}
                    onEdit={(id) => {
                        if (active === 'frames') setEditingFrameId(id)
                        else if (active === 'videos') setEditingVideoId(id)
                        else setEditingRenderId(id)
                    }}
                    onDelete={(id) => {
                        if (active === 'frames') {
                            const frame = frameTemplates.find((entry) => entry.id === id)
                            if (frame) void handleDeleteFrame(frame)
                        } else if (active === 'videos') {
                            const video = videoTemplates.find((entry) => entry.id === id)
                            if (video) void handleDeleteVideo(video)
                        } else {
                            const story = designs.find((entry) => entry.id === id)
                            if (story) void handleDeleteRender(story)
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default DesignStudio
