import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTc } from '@toolcase/web-components/react'
import { TcAlert } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { baseName, slug } from 'helpers/naming'
import { WorkspaceAction, WorkspaceRailEntry } from 'components/ToolWorkspace'
import ToolShell from 'components/ToolShell'
import { ToolControl, ToolInlineControls, ToolSection } from 'components/ToolControls'
import { Project } from 'types'

type Strings = ReturnType<typeof useStrings>['t']['tools']

type Props = {
    project: Project
}

type PhysicsShape =
    | { type: 'polygon'; points: { x: number; y: number }[] }
    | { type: 'circle'; x: number; y: number; r: number }
    | { type: 'box'; x: number; y: number; w: number; h: number }

type PhysicsTool = 'select' | 'polygon' | 'circle' | 'box' | 'none'

type PhysicsEditorElement = HTMLElement & {
    undo: () => void
    redo: () => void
    deleteSelected: () => void
    clear: () => void
    cancelDrawing: () => void
    autoFit: () => void
    readonly canUndo: boolean
    readonly canRedo: boolean
    readonly canAutoFit: boolean
    readonly selectedIndex: number
}

type PhysicsSettings = {
    tool: PhysicsTool
    snap: number
    minSize: number
    handleSize: number
    handleHit: number
    handles: boolean
    shortcuts: boolean
    historyLimit: number
    alphaThreshold: number
    simplifyTolerance: number
    maxAlphaDim: number
    autoFitOnLoad: boolean
}

const DEFAULTS: PhysicsSettings = {
    tool: 'select',
    snap: 0,
    minSize: 4,
    handleSize: 8,
    handleHit: 9,
    handles: true,
    shortcuts: true,
    historyLimit: 0,
    alphaThreshold: 1,
    simplifyTolerance: 1.5,
    maxAlphaDim: 512,
    autoFitOnLoad: false,
}

const NONE = ''

type EditorState = {
    shapes: number
    selected: number
    canUndo: boolean
    canRedo: boolean
}

const IDLE_EDITOR: EditorState = { shapes: 0, selected: -1, canUndo: false, canRedo: false }

const buildPanels = (s: Strings, settings: PhysicsSettings, patch: (next: Partial<PhysicsSettings>) => void, draw: ToolControl[], select: ToolControl[]): ToolSection[] => [
    {
        key: 'drawing',
        label: s.sections.drawing,
        controls: [
            ...draw,
            { key: 'handlesDivider', kind: 'divider', label: s.sections.handles },
            ...select,
            {
                key: 'shortcuts',
                kind: 'toggle',
                label: s.controls.shortcuts,
                value: settings.shortcuts,
                onChange: (value) => patch({ shortcuts: value }),
            },
            {
                key: 'historyLimit',
                kind: 'slider',
                label: s.controls.historyLimit,
                value: settings.historyLimit,
                min: 0,
                max: 200,
                step: 10,
                onChange: (value) => patch({ historyLimit: value }),
            },
        ],
    },
    {
        key: 'autoFit',
        label: s.sections.autoFit,
        controls: [
            {
                key: 'alphaThreshold',
                kind: 'slider',
                label: s.controls.alphaThreshold,
                value: settings.alphaThreshold,
                min: 0,
                max: 255,
                onChange: (value) => patch({ alphaThreshold: value }),
            },
            {
                key: 'simplifyTolerance',
                kind: 'slider',
                label: s.controls.simplifyTolerance,
                value: settings.simplifyTolerance,
                min: 0,
                max: 10,
                step: 0.1,
                suffix: 'px',
                onChange: (value) => patch({ simplifyTolerance: value }),
            },
            {
                key: 'maxAlphaDim',
                kind: 'slider',
                label: s.controls.maxAlphaDim,
                value: settings.maxAlphaDim,
                min: 64,
                max: 2048,
                step: 64,
                suffix: 'px',
                onChange: (value) => patch({ maxAlphaDim: value }),
            },
            {
                key: 'autoFitOnLoad',
                kind: 'toggle',
                label: s.controls.autoFitOnLoad,
                value: settings.autoFitOnLoad,
                onChange: (value) => patch({ autoFitOnLoad: value }),
            },
        ],
    },
]

const PhysicsShapesTool: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const s = t.tools

    const assets = useStore((state) => state.assets)
    const fetchAssets = useStore((state) => state.fetchAssets)
    const loadAssetBlob = useStore((state) => state.loadAssetBlob)
    const saveToolAsset = useStore((state) => state.saveToolAsset)
    const addAlert = useStore((state) => state.addAlert)
    const canWrite = useProjectCan('file.write')

    const [textureId, setTextureId] = useState(NONE)
    const [source, setSource] = useState<Blob | null>(null)
    const [textureLoading, setTextureLoading] = useState(false)
    const [settings, setSettings] = useState<PhysicsSettings>(DEFAULTS)
    const [editorState, setEditorState] = useState<EditorState>(IDLE_EDITOR)

    const shapes = useRef<PhysicsShape[]>([])

    useEffect(() => {
        void fetchAssets(project.id)
    }, [project.id, fetchAssets])

    const textures = useMemo(
        () => assets.filter((asset) => asset.kind === 'texture' && asset.uploadStatus === 'ready'),
        [assets]
    )

    const items = useMemo(
        () => [
            { key: NONE, name: s.noTexture },
            ...textures.map((asset) => ({ key: asset.id, name: asset.name })),
        ],
        [textures, s.noTexture]
    )

    const texture = textures.find((asset) => asset.id === textureId)

    const selectTexture = async (id: string) => {
        setTextureId(id)
        setSource(null)
        shapes.current = []
        setEditorState(IDLE_EDITOR)
        if (!id) return
        setTextureLoading(true)
        try {
            const blob = await loadAssetBlob(project.id, id)
            if (blob) setSource(blob)
        } finally {
            setTextureLoading(false)
        }
    }

    const editor = useTc<PhysicsEditorElement>(
        { source },
        {
            'tc-change': (event: Event) => {
                const next = (event as CustomEvent<{ shapes: PhysicsShape[] }>).detail?.shapes ?? []
                shapes.current = next
                syncState()
            },
        }
    )

    const syncState = () => {
        const node = editor.current
        if (!node) return
        setEditorState({
            shapes: shapes.current.length,
            selected: node.selectedIndex,
            canUndo: node.canUndo,
            canRedo: node.canRedo,
        })
    }

    const run = (action: (node: PhysicsEditorElement) => void) => {
        const node = editor.current
        if (!node) return
        action(node)
        syncState()
    }

    const patch = (next: Partial<PhysicsSettings>) => setSettings((current) => ({ ...current, ...next }))

    const defaultName = texture ? `${slug(baseName(texture.name))}-physics` : 'physics-shapes'

    const save = async (name: string) => {
        if (shapes.current.length === 0) return
        const payload = { shapes: shapes.current }
        const file = new File([JSON.stringify(payload)], `${name}.json`, { type: 'application/json' })
        const saved = await saveToolAsset(project.id, {
            file,
            kind: 'physics',
            parentAssetId: texture?.id,
        })
        if (saved) {
            addAlert({
                variant: 'success',
                message: texture ? s.savedAsChild(texture.name) : s.savedStandalone,
                dismissible: true,
            })
        }
    }

    const tools: WorkspaceRailEntry[] = [
        {
            key: 'reset',
            icon: 'RefreshCw',
            label: s.actions.resetSettings,
            active: false,
            onSelect: () => setSettings(DEFAULTS),
        },
        'separator',
        {
            key: 'select',
            icon: 'MousePointer2',
            label: s.options.select,
            disabled: !canWrite,
            onSelect: () => patch({ tool: 'select' }),
        },
        {
            key: 'polygon',
            icon: 'Pentagon',
            label: s.options.polygon,
            disabled: !canWrite,
            onSelect: () => patch({ tool: 'polygon' }),
        },
        {
            key: 'circle',
            icon: 'Circle',
            label: s.options.circle,
            disabled: !canWrite,
            onSelect: () => patch({ tool: 'circle' }),
        },
        {
            key: 'box',
            icon: 'Square',
            label: s.options.box,
            disabled: !canWrite,
            onSelect: () => patch({ tool: 'box' }),
        },
        {
            key: 'none',
            icon: 'Ban',
            label: s.options.off,
            disabled: !canWrite,
            onSelect: () => patch({ tool: 'none' }),
        },
    ]

    const actions: WorkspaceAction[] = [
        {
            key: 'undo',
            icon: 'Undo2',
            label: s.actions.undo,
            disabled: !editorState.canUndo,
            onExec: () => run((node) => node.undo()),
        },
        {
            key: 'redo',
            icon: 'Redo2',
            label: s.actions.redo,
            disabled: !editorState.canRedo,
            onExec: () => run((node) => node.redo()),
        },
        {
            key: 'delete',
            icon: 'Trash2',
            label: s.actions.deleteShape,
            variant: 'danger',
            disabled: editorState.selected < 0,
            onExec: () => run((node) => node.deleteSelected()),
        },
        {
            key: 'clear',
            icon: 'Eraser',
            label: s.actions.clearShapes,
            variant: 'danger',
            disabled: editorState.shapes === 0,
            onExec: () => run((node) => node.clear()),
        },
        {
            key: 'cancel',
            icon: 'X',
            label: s.actions.cancelDrawing,
            onExec: () => run((node) => node.cancelDrawing()),
        },
        {
            key: 'autoFit',
            icon: 'Scan',
            label: s.actions.autoFit,
            disabled: !source,
            onExec: () => run((node) => node.autoFit()),
        },
    ]

    const drawControls: ToolControl[] = [
        {
            key: 'snap',
            kind: 'slider',
            label: s.controls.snap,
            value: settings.snap,
            min: 0,
            max: 64,
            suffix: 'px',
            onChange: (value) => patch({ snap: value }),
        },
        {
            key: 'minSize',
            kind: 'slider',
            label: s.controls.minSize,
            value: settings.minSize,
            min: 1,
            max: 64,
            suffix: 'px',
            onChange: (value) => patch({ minSize: value }),
        },
    ]

    const selectControls: ToolControl[] = [
        {
            key: 'handles',
            kind: 'toggle',
            label: s.controls.handles,
            value: settings.handles,
            onChange: (value) => patch({ handles: value }),
        },
        {
            key: 'handleSize',
            kind: 'slider',
            label: s.controls.handleSize,
            value: settings.handleSize,
            min: 4,
            max: 24,
            suffix: 'px',
            onChange: (value) => patch({ handleSize: value }),
        },
        {
            key: 'handleHit',
            kind: 'slider',
            label: s.controls.handleHit,
            value: settings.handleHit,
            min: 4,
            max: 32,
            suffix: 'px',
            onChange: (value) => patch({ handleHit: value }),
        },
    ]

    const options = (
        <ToolInlineControls
            controls={settings.tool === 'select' ? selectControls : settings.tool === 'none' ? [] : drawControls}
            disabled={!canWrite}
        />
    )

    const panels = buildPanels(s, settings, patch, drawControls, selectControls)

    const status = (
        <>
            <span>
                {s.status.tool}{' '}
                <span className="tool-shell__status-value">
                    {tools.find(
                        (entry): entry is Exclude<WorkspaceRailEntry, string> =>
                            typeof entry !== 'string' && entry.key === settings.tool
                    )?.label ?? settings.tool}
                </span>
            </span>
            <span>
                {s.status.shapes} <span className="tool-shell__status-value">{editorState.shapes}</span>
            </span>
            <span>
                {s.status.selection}{' '}
                <span className="tool-shell__status-value">
                    {editorState.selected >= 0 ? s.shapeSelected(editorState.selected) : s.status.none}
                </span>
            </span>
            <span>
                {s.status.source}{' '}
                <span className="tool-shell__status-value">{texture ? texture.name : s.status.none}</span>
            </span>
            <span className="tool-shell__status-spacer">{s.drawHint}</span>
        </>
    )

    return (
        <ToolShell
            alerts={textures.length === 0 && <TcAlert variant="secondary">{s.noTextures}</TcAlert>}
            picker={{
                label: s.pickTexture,
                items,
                value: textureId,
                placeholder: s.noTexture,
                loading: textureLoading,
                loadingText: s.textureLoading,
                onChange: (id) => void selectTexture(id),
            }}
            options={options}
            tools={tools}
            activeTool={settings.tool}
            toolsLabel={s.status.tools}
            actions={actions}
            panels={panels}
            panelsDisabled={!canWrite}
            status={status}
            canWrite={canWrite}
            defaultName={defaultName}
            saveDisabled={editorState.shapes === 0 || textureLoading}
            hint={editorState.shapes === 0 ? s.drawFirst : undefined}
            onSave={save}
        >
            <tc-physics-editor
                ref={editor}
                fit-parent
                tool={settings.tool}
                snap={settings.snap}
                min-size={settings.minSize}
                handle-size={settings.handleSize}
                handle-hit={settings.handleHit}
                handles={settings.handles ? 'on' : 'off'}
                shortcuts={settings.shortcuts ? 'on' : 'off'}
                history-limit={settings.historyLimit}
                alpha-threshold={settings.alphaThreshold}
                simplify-tolerance={settings.simplifyTolerance}
                max-alpha-dim={settings.maxAlphaDim}
                auto-fit={settings.autoFitOnLoad || undefined}
                readonly={!canWrite || undefined}
            ></tc-physics-editor>
        </ToolShell>
    )
}

export default PhysicsShapesTool
