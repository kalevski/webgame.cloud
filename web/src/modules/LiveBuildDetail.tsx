import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'
import { Project } from 'types'

type Props = {
    project: Project
}

type ValueElement = HTMLElement & { value?: unknown; schema?: unknown }

const LiveBuildDetail: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const l = t.live
    const c = t.configs
    const { buildId } = useParams()
    const navigate = useNavigate()

    const detail = useStore((state) => state.buildDetail)
    const fetchBuild = useStore((state) => state.fetchBuild)
    const configs = useStore((state) => state.configs)
    const schemas = useStore((state) => state.schemas)
    const activeVersion = useStore((state) => state.activeVersion)
    const fetchConfigs = useStore((state) => state.fetchConfigs)
    const fetchSchemas = useStore((state) => state.fetchSchemas)
    const fetchVersion = useStore((state) => state.fetchVersion)
    const saveVersion = useStore((state) => state.saveVersion)

    const canWrite = useProjectCan('config.write')
    const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
    const [values, setValues] = useState<Record<string, unknown>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!buildId) return
        void fetchBuild(project.id, buildId)
        void fetchConfigs(project.id)
        void fetchSchemas(project.id)
    }, [project.id, buildId, fetchBuild, fetchConfigs, fetchSchemas])

    const buildTag = detail?.buildTag ?? ''

    const scopedConfigs = useMemo(() => {
        const keys = new Set((detail?.snapshot?.configs ?? []).map((entry) => entry.key))
        if (keys.size === 0) return configs
        return configs.filter((config) => keys.has(config.key))
    }, [configs, detail])

    const effectiveConfigId = activeConfigId || (scopedConfigs[0]?.id ?? '')

    useEffect(() => {
        if (!effectiveConfigId) return
        void fetchVersion(project.id, effectiveConfigId, buildTag || 'default')
    }, [project.id, effectiveConfigId, buildTag, fetchVersion])

    useEffect(() => {
        setValues(activeVersion?.values ?? {})
    }, [activeVersion])

    const activeConfig = scopedConfigs.find((config) => config.id === effectiveConfigId) ?? null
    const schema = schemas.find((entry) => entry.id === activeConfig?.schemaId) ?? null

    const editor = useTc<ValueElement>({
        schema: JSON.stringify(schema?.definition ?? []),
        value: values,
        disabled: !canWrite,
        onChange: (next: unknown) => setValues((next ?? {}) as Record<string, unknown>),
    })

    const assetRows = useMemo(
        () =>
            (detail?.snapshot?.assets ?? [])
                .map((asset) =>
                    [
                        '<tr>',
                        `<td><strong>${escapeHtml(asset.name)}</strong></td>`,
                        `<td>${escapeHtml(asset.kind)}</td>`,
                        `<td>${(asset.tags ?? [])
                            .map((tag) => `<tc-badge variant="secondary">${escapeHtml(tag)}</tc-badge>`)
                            .join(' ')}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(asset.sizeBytes))}</td>`,
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [detail]
    )

    const assetTable = useTc<ValueElement>({
        columns: [
            { key: 'name', label: l.colAsset, minWidth: '14rem' },
            { key: 'kind', label: l.colKind },
            { key: 'tags', label: l.colTags, minWidth: '10rem' },
            { key: 'size', label: l.colSize, align: 'right' },
        ],
        rows: assetRows,
        total: detail?.snapshot?.assets?.length ?? 0,
        offset: 0,
        limit: Math.max(detail?.snapshot?.assets?.length ?? 0, 1),
    })

    const outputRows = useMemo(
        () =>
            (detail?.files ?? [])
                .map((file) =>
                    [
                        '<tr>',
                        `<td><strong>${escapeHtml(file.name)}</strong></td>`,
                        `<td>${escapeHtml(file.group)}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(file.sizeBytes))}</td>`,
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [detail]
    )

    const outputTable = useTc<ValueElement>({
        columns: [
            { key: 'name', label: l.colOutput, minWidth: '14rem' },
            { key: 'group', label: l.colGroup },
            { key: 'size', label: l.colSize, align: 'right' },
        ],
        rows: outputRows,
        total: detail?.files.length ?? 0,
        offset: 0,
        limit: Math.max(detail?.files.length ?? 0, 1),
    })

    const submit = async () => {
        if (!effectiveConfigId) return
        setSaving(true)
        try {
            await saveVersion(project.id, effectiveConfigId, buildTag || 'default', values)
        } finally {
            setSaving(false)
        }
    }

    const snapshotBundle = detail?.snapshot?.bundle ?? null

    return (
        <div className="module module-live-build">
            <div className="module-live-build__actions">
                <tc-button variant="secondary" outline onClick={() => navigate(`/projects/${project.id}/live`)}>
                    {l.backToLive}
                </tc-button>
            </div>

            {!detail ? (
                <tc-empty-state icon="rocket">{l.loading}</tc-empty-state>
            ) : (
                <>
                    <tc-metric-grid columns="4">
                        <tc-metric-tile
                            label={l.metricStatus}
                            value={t.builds.status[detail.status] ?? detail.status}
                        ></tc-metric-tile>
                        <tc-metric-tile label={l.metricTag} value={detail.buildTag || l.untagged}></tc-metric-tile>
                        <tc-metric-tile label={l.metricSize} value={formatBytes(detail.sizeBytes)}></tc-metric-tile>
                        <tc-metric-tile
                            label={l.metricTriggered}
                            value={formatDateTime(detail.createdAt)}
                        ></tc-metric-tile>
                    </tc-metric-grid>

                    <tc-section-card title={l.bundleSnapshotTitle}>
                        <tc-stack direction="vertical" gap="0.6rem">
                            <tc-text variant="muted">{l.bundleSnapshotIntro}</tc-text>
                            {snapshotBundle ? (
                                <dl className="module-live-build__facts">
                                    <div className="module-live-build__fact">
                                        <dt>{t.bundles.nameLabel}</dt>
                                        <dd>{snapshotBundle.name}</dd>
                                    </div>
                                    <div className="module-live-build__fact">
                                        <dt>{t.bundles.engineLabel}</dt>
                                        <dd>{snapshotBundle.engine}</dd>
                                    </div>
                                    <div className="module-live-build__fact">
                                        <dt>{t.bundles.includedLabel}</dt>
                                        <dd>{snapshotBundle.includedTags.join(', ') || l.none}</dd>
                                    </div>
                                    <div className="module-live-build__fact">
                                        <dt>{t.bundles.excludedLabel}</dt>
                                        <dd>{snapshotBundle.excludedTags.join(', ') || l.none}</dd>
                                    </div>
                                    <div className="module-live-build__fact">
                                        <dt>{t.bundles.algorithmLabel}</dt>
                                        <dd>{snapshotBundle.algorithm}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <tc-empty-state icon="package">{l.noSnapshot}</tc-empty-state>
                            )}
                        </tc-stack>
                    </tc-section-card>

                    <tc-section-card title={l.assetsTitle}>
                        <tc-stack direction="vertical" gap="0.6rem">
                            <tc-text variant="muted">{l.assetsIntro}</tc-text>
                            <div>
                                <tc-empty-state
                                    icon="image"
                                    hidden={(detail.snapshot?.assets?.length ?? 0) > 0 || undefined}
                                >
                                    {l.noAssets}
                                </tc-empty-state>
                                <tc-advanced-table
                                    ref={assetTable}
                                    hidden={(detail.snapshot?.assets?.length ?? 0) === 0 || undefined}
                                ></tc-advanced-table>
                            </div>
                        </tc-stack>
                    </tc-section-card>

                    <tc-section-card title={l.outputsTitle}>
                        <div>
                            <tc-empty-state icon="file" hidden={detail.files.length > 0 || undefined}>
                                {l.noOutputs}
                            </tc-empty-state>
                            <tc-advanced-table
                                ref={outputTable}
                                hidden={detail.files.length === 0 || undefined}
                            ></tc-advanced-table>
                        </div>
                    </tc-section-card>

                    <tc-section-card title={l.configTitle}>
                        <tc-stack direction="vertical" gap="0.6rem">
                            <tc-alert variant="info">{l.configIntro(buildTag || l.defaultTag)}</tc-alert>

                            <div>
                                <tc-empty-state icon="sliders" hidden={scopedConfigs.length > 0 || undefined}>
                                    {l.noConfigs}
                                </tc-empty-state>
                                <div hidden={scopedConfigs.length === 0 || undefined}>
                                    <div className="module-live-build__config-tabs">
                                        {scopedConfigs.map((config) => (
                                            <tc-button
                                                key={config.id}
                                                variant={config.id === effectiveConfigId ? 'primary' : 'secondary'}
                                                outline={config.id === effectiveConfigId ? undefined : true}
                                                size="sm"
                                                onClick={() => setActiveConfigId(config.id)}
                                            >
                                                {config.key}
                                            </tc-button>
                                        ))}
                                    </div>

                                    <tc-json-editor ref={editor}></tc-json-editor>

                                    {canWrite && (
                                        <tc-button
                                            variant="primary"
                                            disabled={saving || undefined}
                                            onClick={submit}
                                        >
                                            {c.save}
                                        </tc-button>
                                    )}
                                </div>
                            </div>
                        </tc-stack>
                    </tc-section-card>
                </>
            )}
        </div>
    )
}

export default LiveBuildDetail
