import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    TcActionHeader,
    TcActionHeaderAction,
    TcDivider,
    TcEmptyState,
    TcFormInput,
    TcJSONSchemaDef,
    TcVerticalItemList,
    TcVerticalItemListItem,
} from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { Project, SchemaProperty } from 'types'

type Props = {
    project: Project
}

type SchemaDraft = {
    name?: string
    definition?: SchemaProperty[]
}

const SchemaEditor: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const c = t.configs

    const schemas = useStore((state) => state.schemas)
    const fetchSchemas = useStore((state) => state.fetchSchemas)
    const saveSchema = useStore((state) => state.saveSchema)
    const deleteSchema = useStore((state) => state.deleteSchema)

    const canWrite = useProjectCan('config.write')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [draft, setDraft] = useState<SchemaDraft | null>(null)

    useEffect(() => {
        void fetchSchemas(project.id)
    }, [project.id, fetchSchemas])

    const knownCount = useRef(0)

    useEffect(() => {
        if (schemas.length > knownCount.current && knownCount.current > 0) {
            const newest = [...schemas].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
            if (newest) {
                setSelectedId(newest.id)
                setDraft(null)
            }
        }
        knownCount.current = schemas.length
        if (!selectedId && schemas.length > 0) setSelectedId(schemas[0].id)
    }, [schemas, selectedId])

    const selected = schemas.find((schema) => schema.id === selectedId) ?? null

    const items: TcVerticalItemListItem[] = schemas.map((schema) => ({
        key: schema.id,
        text: schema.name,
        icon: 'file-earmark-code',
        badge: schema.usedByCount > 0 ? String(schema.usedByCount) : undefined,
    }))

    const refList = useMemo(
        () => schemas
            .filter((schema) => schema.id !== selectedId)
            .map((schema) => ({ id: schema.id, label: schema.name })),
        [schemas, selectedId]
    )

    const actions: TcActionHeaderAction[] = canWrite
        ? [
            ...(draft ? [{ key: 'save', label: c.save, icon: 'save' }] : []),
            ...(selected ? [{ key: 'delete', label: c.delete, icon: 'trash' }] : []),
        ]
        : []

    const handleAction = async (key: string) => {
        if (key === 'delete' && selected) {
            const removed = await deleteSchema(project.id, selected.id)
            if (removed) setSelectedId(null)
        }
        if (key === 'save' && selected) {
            const saved = await saveSchema(
                project.id,
                {
                    name: draft?.name ?? selected.name,
                    definition: draft?.definition ?? selected.definition,
                },
                selected.id
            )
            if (saved) setDraft(null)
        }
    }

    return (
        <div className="module schema-editor">
            <TcActionHeader actions={actions} onExec={(key) => void handleAction(key)} />

            {schemas.length === 0 ? (
                <TcEmptyState icon="file-earmark-code">
                    <p>{c.emptySchemas}</p>
                    <p>{c.emptySchemasHint}</p>
                </TcEmptyState>
            ) : (
                <TcVerticalItemList
                    items={items}
                    activeKey={selectedId ?? undefined}
                    onSelect={(key) => {
                        setSelectedId(key)
                        setDraft(null)
                    }}
                >
                    <div className="schema-editor__workspace">
                        {selected && (
                            <>
                            <div className="schema-editor__fields">
                                <TcFormInput
                                    type="text"
                                    label={c.nameLabel}
                                    key={`name-${selected.id}`}
                                    value={draft?.name ?? selected.name}
                                    onChange={(value) =>
                                        setDraft((current) => ({ ...current, name: String(value ?? '') }))}
                                    required
                                    helper={c.schemaNameHelper}
                                    disabled={!canWrite}
                                />
                            </div>
                            <TcDivider label={c.schemaLabel} />
                            <tc-helper-text icon="Workflow">{c.refHint}</tc-helper-text>
                            <TcJSONSchemaDef
                                objectRefList={refList}
                                arrayRefList={refList}
                                className="schema-editor--def"
                                label={selected.name}
                                key={`definition-${selected.id}-${draft === null ? 'saved' : 'dirty'}`}
                                value={JSON.stringify(draft?.definition ?? selected.definition)}
                                onChange={(value) => {
                                    try {
                                        const parsed = JSON.parse(value) as SchemaProperty[]
                                        setDraft((current) => ({ ...current, definition: parsed }))
                                    } catch {
                                        return
                                    }
                                }}
                            />
                            </>
                        )}
                    </div>
                </TcVerticalItemList>
            )}
        </div>
    )
}

export default SchemaEditor
