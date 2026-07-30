import React, { useEffect, useMemo, useState } from 'react'
import {
    TcActionHeader,
    TcActionHeaderAction,
    TcAlert,
    TcEmptyState,
    TcJSONEditor,
    TcTabItem,
    TcTabSections,
    TcVerticalItemList,
    TcVerticalItemListItem,
} from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { Project } from 'types'

type Props = {
    project: Project
}

const DEFAULT_TAB = 'default'

const ConfigEditor: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const c = t.configs

    const configs = useStore((state) => state.configs)
    const configsLoaded = useStore((state) => state.configsLoaded)
    const schemas = useStore((state) => state.schemas)
    const activeVersion = useStore((state) => state.activeVersion)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const fetchConfigs = useStore((state) => state.fetchConfigs)
    const fetchSchemas = useStore((state) => state.fetchSchemas)
    const fetchCategoriesAndTags = useStore((state) => state.fetchCategoriesAndTags)
    const fetchVersion = useStore((state) => state.fetchVersion)
    const saveVersion = useStore((state) => state.saveVersion)
    const deleteConfig = useStore((state) => state.deleteConfig)
    const refreshSchema = useStore((state) => state.refreshSchema)

    const canWrite = useProjectCan('config.write')

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB)
    const [draft, setDraft] = useState<Record<string, unknown> | null>(null)

    useEffect(() => {
        void fetchConfigs(project.id)
        void fetchSchemas(project.id)
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchConfigs, fetchSchemas, fetchCategoriesAndTags])

    useEffect(() => {
        if (!selectedId && configs.length > 0) setSelectedId(configs[0].id)
    }, [configs, selectedId])

    useEffect(() => {
        if (selectedId) {
            setDraft(null)
            void fetchVersion(project.id, selectedId, activeTab)
        }
    }, [project.id, selectedId, activeTab, fetchVersion])

    const selected = configs.find((config) => config.id === selectedId) ?? null
    const schema = schemas.find((entry) => entry.id === selected?.schemaId) ?? null

    const items: TcVerticalItemListItem[] = configs.map((config) => ({
        key: config.id,
        text: config.key,
        icon: 'sliders',
        badge: config.stale ? '●' : undefined,
    }))

    const tabItems: TcTabItem[] = useMemo(() => {
        const tags = categoriesAndTags?.buildTags ?? []
        return [
            { key: DEFAULT_TAB, label: c.defaultTab },
            ...tags.map((tag) => ({
                key: tag.name,
                label: selected?.versions.some((version) => version.buildTag === tag.name)
                    ? `${tag.name} ●`
                    : tag.name,
            })),
        ]
    }, [categoriesAndTags, selected, c.defaultTab])

    const actions: TcActionHeaderAction[] = canWrite
        ? [
            ...(draft ? [{ key: 'save', label: c.save, icon: 'save' }] : []),
            ...(selected?.stale ? [{ key: 'refresh', label: c.updateSchema, icon: 'arrow-repeat' }] : []),
            ...(selected ? [{ key: 'delete', label: c.delete, icon: 'trash' }] : []),
        ]
        : []

    const handleAction = async (key: string) => {
        if (key === 'refresh' && selected) void refreshSchema(project.id, selected.id)
        if (key === 'delete' && selected) {
            const removed = await deleteConfig(project.id, selected.id)
            if (removed) setSelectedId(null)
        }
        if (key === 'save' && selected && draft) {
            const saved = await saveVersion(project.id, selected.id, activeTab, draft)
            if (saved) setDraft(null)
        }
    }

    return (
        <div className="module config-editor">
            <TcActionHeader actions={actions} onExec={(key) => void handleAction(key)} />

            {schemas.length === 0 && <TcAlert variant="info">{c.needSchema}</TcAlert>}

            {configsLoaded && configs.length === 0 ? (
                <TcEmptyState icon="sliders">
                    <p>{c.emptyConfigs}</p>
                </TcEmptyState>
            ) : (
                <TcVerticalItemList
                    items={items}
                    activeKey={selectedId ?? undefined}
                    onSelect={(key) => {
                        setSelectedId(key)
                        setActiveTab(DEFAULT_TAB)
                        setDraft(null)
                    }}
                >
                    <div className="config-editor__workspace">
                        {selected && (
                            <>
                                <TcTabSections
                                    activeKey={activeTab}
                                    items={tabItems}
                                    onChange={setActiveTab}
                                />
                                <TcJSONEditor
                                    key={`${selected.id}-${activeTab}-${draft === null ? 'saved' : 'dirty'}`}
                                    schema={JSON.stringify(schema?.definition ?? [])}
                                    value={draft ?? activeVersion?.values ?? {}}
                                    disabled={!canWrite}
                                    onChange={(value) => setDraft(value)}
                                />
                            </>
                        )}
                    </div>
                </TcVerticalItemList>
            )}
        </div>
    )
}

export default ConfigEditor
