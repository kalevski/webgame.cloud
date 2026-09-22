import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const CreateConfigModal: React.FC = () => {
    const closeModal = useModalClose()
    const projectId = useModalInput<string>(MODAL.CREATE_CONFIG)
    const schemas = useStore((state) => state.schemas)
    const createConfig = useStore((state) => state.createConfig)
    const { t } = useStrings()
    const c = t.configs

    const [key, setKey] = useState('')
    const [schemaId, setSchemaId] = useState(schemas[0]?.id ?? '')
    const [saving, setSaving] = useState(false)

    const keyInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setKey(String(value ?? '')),
    })
    const schemaSelect = useTc<ValueElement>({
        items: schemas.map((schema) => ({ key: schema.id, label: schema.name })),
        defaultValue: schemas[0]?.id ?? '',
        onChange: (value: unknown) => setSchemaId(String(value ?? '')),
    })

    const submit = async () => {
        if (!projectId) return
        setSaving(true)
        try {
            const done = await createConfig(projectId, { key: key.trim(), schemaId })
            if (done) closeModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <tc-form-input ref={keyInput} label={c.keyLabel} required />
            <tc-label>{c.schemaLabel}</tc-label>
            <tc-extended-select ref={schemaSelect} />
            <SheetFooter>
                <tc-button
                    variant="primary"
                    disabled={saving || key.trim().length === 0 || !schemaId || undefined}
                    onClick={submit}
                >
                    {c.createConfig}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default CreateConfigModal
