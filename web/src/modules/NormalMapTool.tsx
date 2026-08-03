import React, { useEffect, useMemo, useState } from 'react'
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

type NormalMapOutput = {
    dataUrl: string
    width: number
    height: number
}

type NormalMapElement = HTMLElement & {
    regenerate: () => void
    clearPaint: () => void
    clearMask: () => void
    resetView: () => void
}

type PaintTool = 'brush' | 'erase' | 'mask' | 'pan' | 'none'
type NormalMapPreview = 'normal' | 'albedo' | 'lit' | 'lit-surface' | 'height'

type NormalSettings = {
    strength: number
    embossHeight: number
    bevelWidth: number
    autoBlur: boolean
    blurRadius: number
    invertX: boolean
    invertY: boolean
    maxDim: number
    editable: boolean
    tool: PaintTool
    brushSize: number
    brushStrength: number
    brushFalloff: number
    maskColor: string
    maskOpacity: number
    previewMode: NormalMapPreview
    lightTracking: boolean
    lightX: number
    lightY: number
    lightZ: number
    ambient: number
    zoom: number
}

const DEFAULTS: NormalSettings = {
    strength: 1,
    embossHeight: 2,
    bevelWidth: 0,
    autoBlur: true,
    blurRadius: 2,
    invertX: false,
    invertY: false,
    maxDim: 1024,
    editable: true,
    tool: 'brush',
    brushSize: 16,
    brushStrength: 0.6,
    brushFalloff: 1,
    maskColor: '#22d3ee',
    maskOpacity: 0.63,
    previewMode: 'normal',
    lightTracking: true,
    lightX: 0.35,
    lightY: 0.3,
    lightZ: 0.6,
    ambient: 0.2,
    zoom: 1,
}

const buildPanels = (s: Strings, settings: NormalSettings, patch: (next: Partial<NormalSettings>) => void, brush: ToolControl[], pan: ToolControl[]): ToolSection[] => [
    {
        key: 'surface',
        label: s.sections.surface,
        controls: [
            {
                key: 'strength',
                kind: 'slider',
                label: s.controls.strength,
                value: settings.strength,
                min: 0,
                max: 4,
                step: 0.05,
                onChange: (value) => patch({ strength: value }),
            },
            {
                key: 'embossHeight',
                kind: 'slider',
                label: s.controls.embossHeight,
                value: settings.embossHeight,
                min: 0,
                max: 8,
                step: 0.1,
                onChange: (value) => patch({ embossHeight: value }),
            },
            {
                key: 'bevelWidth',
                kind: 'slider',
                label: s.controls.bevelWidth,
                value: settings.bevelWidth,
                min: 0,
                max: 32,
                suffix: 'px',
                onChange: (value) => patch({ bevelWidth: value }),
            },
            {
                key: 'autoBlur',
                kind: 'toggle',
                label: s.controls.autoBlur,
                value: settings.autoBlur,
                onChange: (value) => patch({ autoBlur: value }),
            },
            {
                key: 'blurRadius',
                kind: 'slider',
                label: s.controls.blurRadius,
                value: settings.blurRadius,
                min: 0,
                max: 16,
                step: 0.5,
                suffix: 'px',
                onChange: (value) => patch({ blurRadius: value, autoBlur: false }),
            },
            {
                key: 'invertX',
                kind: 'toggle',
                label: s.controls.invertX,
                value: settings.invertX,
                onChange: (value) => patch({ invertX: value }),
            },
            {
                key: 'invertY',
                kind: 'toggle',
                label: s.controls.invertY,
                value: settings.invertY,
                onChange: (value) => patch({ invertY: value }),
            },
        ],
    },
    {
        key: 'paint',
        label: s.sections.paint,
        controls: [
            {
                key: 'editable',
                kind: 'toggle',
                label: s.controls.editable,
                value: settings.editable,
                onChange: (value) => patch({ editable: value }),
            },
            ...brush,
            {
                key: 'maskColor',
                kind: 'color',
                label: s.controls.maskColor,
                value: settings.maskColor,
                onChange: (value) => patch({ maskColor: value }),
            },
            {
                key: 'maskOpacity',
                kind: 'slider',
                label: s.controls.maskOpacity,
                value: settings.maskOpacity,
                min: 0,
                max: 1,
                step: 0.05,
                onChange: (value) => patch({ maskOpacity: value }),
            },
        ],
    },
    {
        key: 'light',
        label: s.sections.lightOutput,
        controls: [
            {
                key: 'lightTracking',
                kind: 'toggle',
                label: s.controls.lightTracking,
                value: settings.lightTracking,
                onChange: (value) => patch({ lightTracking: value }),
            },
            {
                key: 'lightX',
                kind: 'slider',
                label: s.controls.lightX,
                value: settings.lightX,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: (value) => patch({ lightX: value }),
            },
            {
                key: 'lightY',
                kind: 'slider',
                label: s.controls.lightY,
                value: settings.lightY,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: (value) => patch({ lightY: value }),
            },
            {
                key: 'lightZ',
                kind: 'slider',
                label: s.controls.lightZ,
                value: settings.lightZ,
                min: 0.05,
                max: 2,
                step: 0.05,
                onChange: (value) => patch({ lightZ: value }),
            },
            {
                key: 'ambient',
                kind: 'slider',
                label: s.controls.ambient,
                value: settings.ambient,
                min: 0,
                max: 1,
                step: 0.05,
                onChange: (value) => patch({ ambient: value }),
            },
            { key: 'outputDivider', kind: 'divider', label: s.sections.output },
            {
                key: 'maxDim',
                kind: 'slider',
                label: s.controls.maxDim,
                value: settings.maxDim,
                min: 128,
                max: 4096,
                step: 128,
                suffix: 'px',
                onChange: (value) => patch({ maxDim: value }),
            },
            ...pan,
        ],
    },
]

const NormalMapTool: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const s = t.tools

    const assets = useStore((state) => state.assets)
    const fetchAssets = useStore((state) => state.fetchAssets)
    const loadAssetBlob = useStore((state) => state.loadAssetBlob)
    const saveToolAsset = useStore((state) => state.saveToolAsset)
    const addAlert = useStore((state) => state.addAlert)
    const canWrite = useProjectCan('file.write')

    const [textureId, setTextureId] = useState('')
    const [source, setSource] = useState<Blob | null>(null)
    const [textureLoading, setTextureLoading] = useState(false)
    const [settings, setSettings] = useState<NormalSettings>(DEFAULTS)
    const [output, setOutput] = useState<NormalMapOutput | null>(null)

    useEffect(() => {
        void fetchAssets(project.id)
    }, [project.id, fetchAssets])

    const textures = useMemo(
        () => assets.filter((asset) => asset.kind === 'texture' && asset.uploadStatus === 'ready'),
        [assets]
    )

    const items = useMemo(() => textures.map((asset) => ({ key: asset.id, name: asset.name })), [textures])

    const texture = textures.find((asset) => asset.id === textureId)

    const hasNormalMap = useMemo(
        () =>
            Boolean(textureId) &&
            assets.some((asset) => asset.parentAssetId === textureId && asset.kind === 'normal-map'),
        [assets, textureId]
    )

    const selectTexture = async (id: string) => {
        setTextureId(id)
        setSource(null)
        setOutput(null)
        if (!id) return
        setTextureLoading(true)
        try {
            const blob = await loadAssetBlob(project.id, id)
            if (blob) setSource(blob)
        } finally {
            setTextureLoading(false)
        }
    }

    const generator = useTc<NormalMapElement>(
        { source },
        {
            'tc-generate': (event: Event) =>
                setOutput((event as CustomEvent<NormalMapOutput>).detail ?? null),
        }
    )

    const patch = (next: Partial<NormalSettings>) => setSettings((current) => ({ ...current, ...next }))

    const pickTool = (tool: PaintTool) =>
        patch({ tool, editable: tool === 'brush' || tool === 'erase' || tool === 'mask' ? true : settings.editable })

    const defaultName = texture ? `${slug(baseName(texture.name))}-normal` : 'normal-map'

    const save = async (name: string) => {
        if (!output || !texture) return
        const response = await fetch(output.dataUrl)
        if (!response.ok) return
        const blob = await response.blob()
        const file = new File([blob], `${name}.png`, { type: 'image/png' })
        const saved = await saveToolAsset(project.id, {
            file,
            kind: 'normal-map',
            parentAssetId: texture.id,
        })
        if (saved) {
            addAlert({ variant: 'success', message: s.savedAsChild(texture.name), dismissible: true })
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
        { key: 'brush', icon: 'Brush', label: s.options.brush, onSelect: () => pickTool('brush') },
        { key: 'erase', icon: 'Eraser', label: s.options.erase, onSelect: () => pickTool('erase') },
        { key: 'mask', icon: 'Highlighter', label: s.options.mask, onSelect: () => pickTool('mask') },
        { key: 'pan', icon: 'Hand', label: s.options.pan, onSelect: () => pickTool('pan') },
        { key: 'none', icon: 'Ban', label: s.options.off, onSelect: () => pickTool('none') },
    ]

    const actions: WorkspaceAction[] = [
        {
            key: 'regenerate',
            icon: 'RefreshCw',
            label: s.actions.regenerate,
            disabled: !source,
            onExec: () => generator.current?.regenerate(),
        },
        {
            key: 'clearPaint',
            icon: 'Trash2',
            label: s.actions.clearPaint,
            disabled: !source,
            onExec: () => generator.current?.clearPaint(),
        },
        {
            key: 'clearMask',
            icon: 'Droplet',
            label: s.actions.clearMask,
            disabled: !source,
            onExec: () => generator.current?.clearMask(),
        },
        {
            key: 'resetView',
            icon: 'Maximize2',
            label: s.actions.resetView,
            disabled: !source,
            onExec: () => generator.current?.resetView(),
        },
    ]

    const brushControls: ToolControl[] = [
        {
            key: 'brushSize',
            kind: 'slider',
            label: s.controls.brushSize,
            value: settings.brushSize,
            min: 1,
            max: 256,
            suffix: 'px',
            onChange: (value) => patch({ brushSize: value }),
        },
        {
            key: 'brushStrength',
            kind: 'slider',
            label: s.controls.brushStrength,
            value: settings.brushStrength,
            min: 0,
            max: 1,
            step: 0.05,
            onChange: (value) => patch({ brushStrength: value }),
        },
        {
            key: 'brushFalloff',
            kind: 'slider',
            label: s.controls.brushFalloff,
            value: settings.brushFalloff,
            min: 0.05,
            max: 1,
            step: 0.05,
            onChange: (value) => patch({ brushFalloff: value }),
        },
    ]

    const maskControls: ToolControl[] = [
        ...brushControls.slice(0, 1),
        {
            key: 'maskColor',
            kind: 'color',
            label: s.controls.maskColor,
            value: settings.maskColor,
            onChange: (value) => patch({ maskColor: value }),
        },
        {
            key: 'maskOpacity',
            kind: 'slider',
            label: s.controls.maskOpacity,
            value: settings.maskOpacity,
            min: 0,
            max: 1,
            step: 0.05,
            onChange: (value) => patch({ maskOpacity: value }),
        },
    ]

    const panControls: ToolControl[] = [
        {
            key: 'zoom',
            kind: 'slider',
            label: s.controls.zoom,
            value: settings.zoom,
            min: 0.1,
            max: 8,
            step: 0.1,
            suffix: '×',
            onChange: (value) => patch({ zoom: value }),
        },
    ]

    const toolControls: ToolControl[] =
        settings.tool === 'mask'
            ? maskControls
            : settings.tool === 'pan'
              ? panControls
              : settings.tool === 'none'
                ? []
                : brushControls

    const options = (
        <ToolInlineControls
            controls={[
                ...toolControls,
                {
                    key: 'previewMode',
                    kind: 'choice',
                    label: s.controls.previewMode,
                    value: settings.previewMode,
                    options: [
                        { value: 'normal', label: s.options.normal },
                        { value: 'albedo', label: s.options.albedo },
                        { value: 'height', label: s.options.height },
                        { value: 'lit', label: s.options.lit },
                        { value: 'lit-surface', label: s.options.litSurface },
                    ],
                    onChange: (value) => patch({ previewMode: value as NormalMapPreview }),
                },
            ]}
            disabled={!source}
        />
    )

    const panels = buildPanels(s, settings, patch, brushControls, panControls)

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
                {s.status.zoom}{' '}
                <span className="tool-shell__status-value">{Math.round(settings.zoom * 100)}%</span>
            </span>
            <span>
                {s.status.size}{' '}
                <span className="tool-shell__status-value">
                    {output ? `${output.width} × ${output.height} px` : s.status.none}
                </span>
            </span>
            <span className="tool-shell__status-spacer">{source ? s.paintHint : s.texturePlaceholder}</span>
        </>
    )

    return (
        <ToolShell
            alerts={
                <>
                    {textures.length === 0 && <TcAlert variant="secondary">{s.noTextures}</TcAlert>}
                    {hasNormalMap && <TcAlert variant="warning">{s.hasNormalMap}</TcAlert>}
                </>
            }
            picker={{
                label: s.pickTexture,
                items,
                value: textureId,
                placeholder: s.texturePlaceholder,
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
            panelsDisabled={!source}
            status={status}
            canWrite={canWrite}
            defaultName={defaultName}
            saveDisabled={!output || !texture || hasNormalMap || textureLoading}
            hint={!output ? s.generateFirst : undefined}
            onSave={save}
        >
            <tc-normal-map-generator
                ref={generator}
                fit-parent
                editable={settings.editable || undefined}
                tool={settings.tool}
                strength={settings.strength}
                emboss-height={settings.embossHeight}
                bevel-width={settings.bevelWidth}
                blur-radius={settings.autoBlur ? undefined : settings.blurRadius}
                invert-x={settings.invertX || undefined}
                invert-y={settings.invertY || undefined}
                max-dim={settings.maxDim}
                brush-size={settings.brushSize}
                brush-strength={settings.brushStrength}
                brush-falloff={settings.brushFalloff}
                mask-color={settings.maskColor}
                mask-opacity={settings.maskOpacity}
                preview-mode={settings.previewMode}
                light-tracking={settings.lightTracking ? 'pointer' : 'off'}
                light-x={settings.lightX}
                light-y={settings.lightY}
                light-z={settings.lightZ}
                ambient={settings.ambient}
                zoom={settings.zoom}
                placeholder={s.texturePlaceholder}
            ></tc-normal-map-generator>
        </ToolShell>
    )
}

export default NormalMapTool
