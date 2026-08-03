import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTc } from '@toolcase/web-components/react'
import { TcAlert } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { baseName, slug } from 'helpers/naming'
import { SYSTEM_FONTS } from 'configs/fonts'
import { WorkspaceAction, WorkspaceRailEntry } from 'components/ToolWorkspace'
import ToolShell from 'components/ToolShell'
import { ToolControl, ToolInlineControls, ToolSection } from 'components/ToolControls'
import { AssetFile, Project } from 'types'

type Strings = ReturnType<typeof useStrings>['t']['tools']

type Props = {
    project: Project
}

type BitmapFontOutput = {
    png: Blob
    text: string
    format: string
    glyphs: string
    width: number
    height: number
}

type BitmapFontElement = HTMLElement & {
    generate: () => Promise<BitmapFontOutput | null>
}

type FontSettings = {
    fontSize: number
    glyphUppercase: boolean
    glyphLowercase: boolean
    glyphDigits: boolean
    glyphSymbols: boolean
    glyphEmojis: boolean
    letterSpacing: number
    padding: number
    glyphsPerRow: number
    lineHeight: number
    fillType: 'solid' | 'gradient'
    fillColor: string
    gradientType: 'linear' | 'radial'
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    borderColor: string
    borderThickness: number
    borderAlign: 'inner' | 'outer' | 'center'
    shadowColor: string
    shadowSize: number
    shadowOffsetX: number
    shadowOffsetY: number
    shadowBlur: number
    glowColor: string
    glowSize: number
    previewText: string
}

const FONT_EXTENSIONS = ['ttf', 'otf']

type FontPresetKey = 'medieval' | 'scifi' | 'arcade' | 'horror' | 'cartoon'

type FontPreset = {
    key: FontPresetKey
    icon: string
    style: Partial<FontSettings>
}

const GLYPH_GROUPS = {
    glyphUppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    glyphLowercase: 'abcdefghijklmnopqrstuvwxyz',
    glyphDigits: '0123456789',
    glyphSymbols: '.,!?-+:;\'"()[]{}#@&%*/\\<>=_',
    glyphEmojis: '😀😁😂😅😊😍😎😢😡👍👎❤⭐✨🔥💀🎉🎮🏆⚡',
} as const

type GlyphGroupKey = keyof typeof GLYPH_GROUPS

const GLYPH_GROUP_KEYS = Object.keys(GLYPH_GROUPS) as GlyphGroupKey[]

const buildGlyphs = (settings: FontSettings): string =>
    GLYPH_GROUP_KEYS.reduce((glyphs, key) => (settings[key] ? glyphs + GLYPH_GROUPS[key] : glyphs), ' ')

const DEFAULTS: FontSettings = {
    fontSize: 48,
    glyphUppercase: true,
    glyphLowercase: true,
    glyphDigits: true,
    glyphSymbols: true,
    glyphEmojis: false,
    letterSpacing: 0,
    padding: 2,
    glyphsPerRow: 16,
    lineHeight: 0,
    fillType: 'solid',
    fillColor: '#ffffff',
    gradientType: 'linear',
    gradientFrom: '#ffffff',
    gradientTo: '#7c5cff',
    gradientAngle: 90,
    borderColor: '#000000',
    borderThickness: 2,
    borderAlign: 'center',
    shadowColor: '#000000',
    shadowSize: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    glowColor: '#00e5ff',
    glowSize: 0,
    previewText: 'The quick brown fox',
}

const STYLE_RESET: Partial<FontSettings> = {
    fillType: DEFAULTS.fillType,
    fillColor: DEFAULTS.fillColor,
    gradientType: DEFAULTS.gradientType,
    gradientFrom: DEFAULTS.gradientFrom,
    gradientTo: DEFAULTS.gradientTo,
    gradientAngle: DEFAULTS.gradientAngle,
    borderColor: DEFAULTS.borderColor,
    borderThickness: DEFAULTS.borderThickness,
    borderAlign: DEFAULTS.borderAlign,
    shadowColor: DEFAULTS.shadowColor,
    shadowSize: DEFAULTS.shadowSize,
    shadowOffsetX: DEFAULTS.shadowOffsetX,
    shadowOffsetY: DEFAULTS.shadowOffsetY,
    shadowBlur: DEFAULTS.shadowBlur,
    glowColor: DEFAULTS.glowColor,
    glowSize: DEFAULTS.glowSize,
}

const PRESETS: FontPreset[] = [
    {
        key: 'medieval',
        icon: 'Castle',
        style: {
            fillType: 'gradient',
            gradientType: 'linear',
            gradientFrom: '#f3e3b0',
            gradientTo: '#b8862d',
            gradientAngle: 90,
            borderColor: '#3b2a12',
            borderThickness: 3,
            borderAlign: 'outer',
            shadowColor: '#1a1206',
            shadowSize: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 3,
            shadowBlur: 2,
        },
    },
    {
        key: 'scifi',
        icon: 'Rocket',
        style: {
            fillType: 'gradient',
            gradientType: 'linear',
            gradientFrom: '#e0fbff',
            gradientTo: '#38bdf8',
            gradientAngle: 180,
            borderColor: '#0e7490',
            borderThickness: 1,
            borderAlign: 'outer',
            glowColor: '#22d3ee',
            glowSize: 10,
        },
    },
    {
        key: 'arcade',
        icon: 'Gamepad2',
        style: {
            fillType: 'gradient',
            gradientType: 'linear',
            gradientFrom: '#ffd93d',
            gradientTo: '#ff6b6b',
            gradientAngle: 180,
            borderColor: '#1a1a2e',
            borderThickness: 4,
            borderAlign: 'outer',
            shadowColor: '#1a1a2e',
            shadowSize: 6,
            shadowOffsetX: 0,
            shadowOffsetY: 6,
            shadowBlur: 0,
        },
    },
    {
        key: 'horror',
        icon: 'Skull',
        style: {
            fillType: 'gradient',
            gradientType: 'linear',
            gradientFrom: '#f2f2f2',
            gradientTo: '#7a0d0d',
            gradientAngle: 180,
            borderColor: '#0a0a0a',
            borderThickness: 2,
            borderAlign: 'outer',
            shadowColor: '#5e0b0b',
            shadowSize: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            shadowBlur: 10,
        },
    },
    {
        key: 'cartoon',
        icon: 'Smile',
        style: {
            fillType: 'solid',
            fillColor: '#ffde59',
            borderColor: '#2b2b2b',
            borderThickness: 5,
            borderAlign: 'outer',
            shadowColor: '#2b2b2b',
            shadowSize: 3,
            shadowOffsetX: 0,
            shadowOffsetY: 3,
            shadowBlur: 0,
        },
    },
]

const buildPanels = (s: Strings, settings: FontSettings, patch: (next: Partial<FontSettings>) => void): ToolSection[] => [
    {
        key: 'style',
        label: s.sections.style,
        controls: [
            {
                key: 'fillType',
                kind: 'choice',
                label: s.controls.fillType,
                value: settings.fillType,
                options: [
                    { value: 'solid', label: s.options.solid },
                    { value: 'gradient', label: s.options.gradient },
                ],
                onChange: (value) => patch({ fillType: value as FontSettings['fillType'] }),
            },
            ...(settings.fillType === 'solid'
                ? ([
                      {
                          key: 'fillColor',
                          kind: 'color',
                          label: s.controls.fillColor,
                          value: settings.fillColor,
                          onChange: (value) => patch({ fillColor: value }),
                      },
                  ] satisfies ToolControl[])
                : ([
                      {
                          key: 'gradientType',
                          kind: 'choice',
                          label: s.controls.gradientType,
                          value: settings.gradientType,
                          options: [
                              { value: 'linear', label: s.options.linear },
                              { value: 'radial', label: s.options.radial },
                          ],
                          onChange: (value) => patch({ gradientType: value as FontSettings['gradientType'] }),
                      },
                      {
                          key: 'gradientFrom',
                          kind: 'color',
                          label: s.controls.gradientFrom,
                          value: settings.gradientFrom,
                          onChange: (value) => patch({ gradientFrom: value }),
                      },
                      {
                          key: 'gradientTo',
                          kind: 'color',
                          label: s.controls.gradientTo,
                          value: settings.gradientTo,
                          onChange: (value) => patch({ gradientTo: value }),
                      },
                      {
                          key: 'gradientAngle',
                          kind: 'slider',
                          label: s.controls.gradientAngle,
                          value: settings.gradientAngle,
                          min: 0,
                          max: 360,
                          suffix: '°',
                          onChange: (value) => patch({ gradientAngle: value }),
                      },
                  ] satisfies ToolControl[])),
            { key: 'outlineDivider', kind: 'divider', label: s.sections.outline },
            {
                key: 'borderThickness',
                kind: 'slider',
                label: s.controls.borderThickness,
                value: settings.borderThickness,
                min: 0,
                max: 24,
                suffix: 'px',
                onChange: (value) => patch({ borderThickness: value }),
            },
            {
                key: 'borderColor',
                kind: 'color',
                label: s.controls.borderColor,
                value: settings.borderColor,
                onChange: (value) => patch({ borderColor: value }),
            },
            {
                key: 'borderAlign',
                kind: 'choice',
                label: s.controls.borderAlign,
                value: settings.borderAlign,
                options: [
                    { value: 'inner', label: s.options.inner },
                    { value: 'center', label: s.options.center },
                    { value: 'outer', label: s.options.outer },
                ],
                onChange: (value) => patch({ borderAlign: value as FontSettings['borderAlign'] }),
            },
        ],
    },
    {
        key: 'effects',
        label: s.sections.effects,
        controls: [
            {
                key: 'shadowSize',
                kind: 'slider',
                label: s.controls.shadowSize,
                value: settings.shadowSize,
                min: 0,
                max: 48,
                suffix: 'px',
                onChange: (value) => patch({ shadowSize: value }),
            },
            {
                key: 'shadowColor',
                kind: 'color',
                label: s.controls.shadowColor,
                value: settings.shadowColor,
                onChange: (value) => patch({ shadowColor: value }),
            },
            {
                key: 'shadowOffsetX',
                kind: 'slider',
                label: s.controls.shadowOffsetX,
                value: settings.shadowOffsetX,
                min: -48,
                max: 48,
                suffix: 'px',
                onChange: (value) => patch({ shadowOffsetX: value }),
            },
            {
                key: 'shadowOffsetY',
                kind: 'slider',
                label: s.controls.shadowOffsetY,
                value: settings.shadowOffsetY,
                min: -48,
                max: 48,
                suffix: 'px',
                onChange: (value) => patch({ shadowOffsetY: value }),
            },
            {
                key: 'shadowBlur',
                kind: 'slider',
                label: s.controls.shadowBlur,
                value: settings.shadowBlur,
                min: 0,
                max: 48,
                suffix: 'px',
                onChange: (value) => patch({ shadowBlur: value }),
            },
            { key: 'glowDivider', kind: 'divider', label: s.sections.glow },
            {
                key: 'glowSize',
                kind: 'slider',
                label: s.controls.glowSize,
                value: settings.glowSize,
                min: 0,
                max: 48,
                suffix: 'px',
                onChange: (value) => patch({ glowSize: value }),
            },
            {
                key: 'glowColor',
                kind: 'color',
                label: s.controls.glowColor,
                value: settings.glowColor,
                onChange: (value) => patch({ glowColor: value }),
            },
        ],
    },
    {
        key: 'glyphs',
        label: s.sections.font,
        controls: [
            ...GLYPH_GROUP_KEYS.map(
                (key): ToolControl => ({
                    key,
                    kind: 'toggle',
                    label: s.controls[key],
                    value: settings[key],
                    onChange: (value) => patch({ [key]: value }),
                })
            ),
            { key: 'metricsDivider', kind: 'divider' },
            {
                key: 'letterSpacing',
                kind: 'slider',
                label: s.controls.letterSpacing,
                value: settings.letterSpacing,
                min: -8,
                max: 32,
                suffix: 'px',
                onChange: (value) => patch({ letterSpacing: value }),
            },
            {
                key: 'lineHeight',
                kind: 'slider',
                label: s.controls.lineHeight,
                value: settings.lineHeight,
                min: 0,
                max: 200,
                suffix: 'px',
                onChange: (value) => patch({ lineHeight: value }),
            },
            {
                key: 'glyphsPerRow',
                kind: 'slider',
                label: s.controls.glyphsPerRow,
                value: settings.glyphsPerRow,
                min: 1,
                max: 32,
                onChange: (value) => patch({ glyphsPerRow: value }),
            },
            {
                key: 'padding',
                kind: 'slider',
                label: s.controls.padding,
                value: settings.padding,
                min: 0,
                max: 32,
                suffix: 'px',
                onChange: (value) => patch({ padding: value }),
            },
        ],
    },
]

const FontGeneratorTool: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const s = t.tools

    const assets = useStore((state) => state.assets)
    const fetchAssets = useStore((state) => state.fetchAssets)
    const loadAssetBlob = useStore((state) => state.loadAssetBlob)
    const saveToolAsset = useStore((state) => state.saveToolAsset)
    const addAlert = useStore((state) => state.addAlert)
    const canWrite = useProjectCan('file.write')

    const [selectedKey, setSelectedKey] = useState(`system:${SYSTEM_FONTS[0]}`)
    const [family, setFamily] = useState<string>(SYSTEM_FONTS[0])
    const [fontLoading, setFontLoading] = useState(false)
    const [fontFailed, setFontFailed] = useState(false)
    const [settings, setSettings] = useState<FontSettings>(DEFAULTS)
    const [revision, setRevision] = useState(0)
    const [output, setOutput] = useState<BitmapFontOutput | null>(null)
    const [stale, setStale] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [preset, setPreset] = useState<FontPresetKey | ''>('')

    const loadedFamilies = useRef(new Set<string>())

    useEffect(() => {
        void fetchAssets(project.id)
    }, [project.id, fetchAssets])

    useEffect(() => {
        setStale(true)
    }, [settings, family])

    const fontAssets = useMemo(
        () =>
            assets.filter(
                (asset) =>
                    asset.kind === 'font' &&
                    asset.uploadStatus === 'ready' &&
                    FONT_EXTENSIONS.includes(asset.extension)
            ),
        [assets]
    )

    const items = useMemo(
        () => [
            ...fontAssets.map((asset) => ({
                key: `asset:${asset.id}`,
                name: asset.name,
                description: s.projectFontsGroup,
            })),
            ...SYSTEM_FONTS.map((name) => ({
                key: `system:${name}`,
                name,
                description: s.systemFontsGroup,
            })),
        ],
        [fontAssets, s.systemFontsGroup, s.projectFontsGroup]
    )

    const selectedAsset: AssetFile | undefined = selectedKey.startsWith('asset:')
        ? fontAssets.find((asset) => asset.id === selectedKey.slice('asset:'.length))
        : undefined

    const selectFont = async (key: string) => {
        setSelectedKey(key)
        setOutput(null)
        setFontFailed(false)

        if (key.startsWith('system:')) {
            setFamily(key.slice('system:'.length))
            return
        }

        const assetId = key.slice('asset:'.length)
        const fontFamily = `tool-font-${assetId}`
        if (loadedFamilies.current.has(fontFamily)) {
            setFamily(fontFamily)
            return
        }

        setFontLoading(true)
        try {
            const blob = await loadAssetBlob(project.id, assetId)
            if (!blob) {
                setFontFailed(true)
                return
            }
            const face = new FontFace(fontFamily, await blob.arrayBuffer())
            await face.load()
            document.fonts.add(face)
            loadedFamilies.current.add(fontFamily)
            setFamily(fontFamily)
        } catch {
            setFontFailed(true)
        } finally {
            setFontLoading(false)
        }
    }

    const generator = useTc<BitmapFontElement>(
        {},
        {
            'tc-generate': (event: Event) => {
                setOutput((event as CustomEvent<BitmapFontOutput>).detail ?? null)
                setStale(false)
            },
        }
    )

    const patch = (next: Partial<FontSettings>) => {
        setPreset('')
        setSettings((current) => ({ ...current, ...next }))
    }

    const applyPreset = (entry: FontPreset) => {
        setPreset(entry.key)
        setSettings((current) => ({ ...current, ...STYLE_RESET, ...entry.style }))
    }

    const resetSettings = () => {
        setPreset('')
        setSettings(DEFAULTS)
        setRevision((current) => current + 1)
    }

    const generate = async () => {
        setGenerating(true)
        try {
            await generator.current?.generate()
        } finally {
            setGenerating(false)
        }
    }

    const defaultName = selectedAsset
        ? `${slug(baseName(selectedAsset.name))}-bitmap`
        : `${slug(family)}-bitmap`

    const save = async (name: string) => {
        if (!output) return
        const pageName = `${name}-0.png`
        const payload = {
            fontFamily: selectedAsset ? selectedAsset.name : family,
            format: output.format,
            descriptor: output.text,
            glyphs: output.glyphs,
            width: output.width,
            height: output.height,
            page: pageName,
        }
        const file = new File([JSON.stringify(payload)], `${name}.json`, { type: 'application/json' })
        const page = new File([output.png], pageName, { type: 'image/png' })
        const saved = await saveToolAsset(project.id, {
            file,
            kind: 'bitmap-font',
            parentAssetId: selectedAsset?.id,
            attachment: { file: page, kind: 'bitmap-font-page' },
        })
        if (saved) {
            addAlert({
                variant: 'success',
                message: selectedAsset ? s.savedAsChild(selectedAsset.name) : s.savedStandalone,
                dismissible: true,
            })
        }
    }

    const styleTools: WorkspaceRailEntry[] = [
        {
            key: 'reset',
            icon: 'RefreshCw',
            label: s.actions.resetSettings,
            active: false,
            onSelect: resetSettings,
        },
        'separator',
        ...PRESETS.map((entry) => ({
            key: entry.key,
            icon: entry.icon,
            label: s.presets[entry.key],
            active: preset === entry.key,
            onSelect: () => applyPreset(entry),
        })),
    ]

    const actions: WorkspaceAction[] = [
        {
            key: 'generate',
            icon: 'WandSparkles',
            label: s.actions.generate,
            variant: 'primary',
            disabled: generating || fontLoading,
            onExec: () => void generate(),
        },
    ]

    const panels = buildPanels(s, settings, patch)

    const options = (
        <ToolInlineControls
            controls={[
                {
                    key: 'fontSize',
                    kind: 'slider',
                    label: s.controls.fontSize,
                    value: settings.fontSize,
                    min: 8,
                    max: 160,
                    suffix: 'px',
                    onChange: (value) => patch({ fontSize: value }),
                },
                {
                    key: 'previewText',
                    kind: 'text',
                    label: s.controls.previewText,
                    value: settings.previewText,
                    onChange: (value) => patch({ previewText: value }),
                },
            ]}
        />
    )

    const status = (
        <>
            <span>
                {s.status.size}{' '}
                <span className="tool-shell__status-value">
                    {output ? `${output.width} × ${output.height} px` : s.status.none}
                </span>
            </span>
            {output && stale && <span className="tool-shell__status-flag">{s.status.stale}</span>}
            {!output && <span className="tool-shell__status-spacer">{s.generateFirst}</span>}
        </>
    )

    return (
        <ToolShell
            alerts={
                <>
                    {fontFailed && <TcAlert variant="danger">{s.fontLoadFailed}</TcAlert>}
                    {fontAssets.length === 0 && <TcAlert variant="secondary">{s.noProjectFonts}</TcAlert>}
                </>
            }
            picker={{
                label: s.pickFont,
                items,
                value: selectedKey,
                searchPlaceholder: s.fontSearch,
                loading: fontLoading,
                loadingText: s.fontLoading,
                onChange: (key) => void selectFont(key),
            }}
            options={options}
            tools={styleTools}
            toolsLabel={s.status.tools}
            actions={actions}
            panels={panels}
            revision={revision}
            status={status}
            canWrite={canWrite}
            defaultName={defaultName}
            saveDisabled={!output || fontLoading}
            hint={!output ? s.generateFirst : undefined}
            onSave={save}
        >
            <tc-bitmap-font-generator
                ref={generator}
                fit-parent
                font-family={family}
                font-size={settings.fontSize}
                glyphs={buildGlyphs(settings)}
                text={settings.previewText}
                letter-spacing={settings.letterSpacing}
                padding={settings.padding}
                glyphs-per-row={settings.glyphsPerRow}
                line-height={settings.lineHeight}
                power-of-two
                fill-type={settings.fillType}
                fill-color={settings.fillColor}
                gradient-type={settings.gradientType}
                gradient-colors={`${settings.gradientFrom},${settings.gradientTo}`}
                gradient-angle={settings.gradientAngle}
                border-color={settings.borderColor}
                border-thickness={settings.borderThickness}
                border-align={settings.borderAlign}
                shadow-color={settings.shadowColor}
                shadow-size={settings.shadowSize}
                shadow-offset-x={settings.shadowOffsetX}
                shadow-offset-y={settings.shadowOffsetY}
                shadow-blur={settings.shadowBlur}
                glow-color={settings.glowColor}
                glow-size={settings.glowSize}
            ></tc-bitmap-font-generator>
        </ToolShell>
    )
}

export default FontGeneratorTool
