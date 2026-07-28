import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { SchemaProperty } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const SchemaEditorModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<{ projectId: string; schemaId: string | null }>(MODAL.SCHEMA_EDITOR)
    const schemas = useStore((state) => state.schemas)
    const saveSchema = useStore((state) => state.saveSchema)
    const { t } = useStrings()
    const c = t.configs

    const existing = schemas.find((schema) => schema.id === input?.schemaId) ?? null
    const [name, setName] = useState(existing?.name ?? '')
    const [definition, setDefinition] = useState<SchemaProperty[]>(existing?.definition ?? [])
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: existing?.name ?? '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const definitionEditor = useTc<ValueElement>({
        defaultValue: existing?.definition ?? [],
        onChange: (value: unknown) => {
            try {
                setDefinition(typeof value === 'string' ? JSON.parse(value) : (value as SchemaProperty[]))
            } catch {
                return
            }
        },
    })

    const submit = async () => {
        if (!input) return
        setSaving(true)
        const done = await saveSchema(input.projectId, { name: name.trim(), definition }, input.schemaId ?? undefined)
        setSaving(false)
        if (done) closeModal(true)
    }

    return (
        <>
            <tc-form-input ref={nameInput} label={c.nameLabel} required />
            <tc-json-schema-def ref={definitionEditor} label={c.schemaLabel}></tc-json-schema-def>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={saving || name.trim().length === 0 || undefined}
                onClick={submit}
            >
                {c.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default SchemaEditorModal
