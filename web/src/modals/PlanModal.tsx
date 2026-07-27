import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useTc } from '@toolcase/web-components/react'
import {
    BILLING_INTERVALS,
    OWNER_ROLE_ID,
    Plan,
    PlanDraft,
    PlanMode,
    PLAN_MODES,
    SALES_FIELD_TYPES,
    SalesField,
    SalesFieldType,
} from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type PlanModalResult = { planId: string }

const EMPTY: PlanDraft = {
    name: '',
    description: '',
    roleId: null,
    mode: 'manual',
    priceCents: 0,
    currency: 'USD',
    interval: 'month',
    position: 0,
    active: true,
    features: [],
    salesFields: [],
}

const toLines = (values: string[]): string => values.join('\n')

const parseFeatures = (raw: string): string[] =>
    raw.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20)

const MAX_FIELDS = 12

const fieldKey = (label: string, index: number): string => {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
    return slug || `field_${index + 1}`
}

type FieldRow = SalesField & { rowId: string }

const toRows = (fields: SalesField[]): FieldRow[] =>
    fields.map((field, index) => ({ ...field, rowId: `${field.key}-${index}` }))

const toSalesFields = (rows: FieldRow[]): SalesField[] => {
    const fields: SalesField[] = []
    for (const row of rows) {
        const label = row.label.trim()
        if (label.length === 0) continue
        fields.push({ key: fieldKey(label, fields.length), label, type: row.type, required: row.required })
    }
    return fields
}

type SalesFieldRowProps = {
    row: FieldRow
    index: number
    onChange: (rowId: string, patch: Partial<SalesField>) => void
    onRemove: (rowId: string) => void
}

const SalesFieldRow: React.FC<SalesFieldRowProps> = ({ row, index, onChange, onRemove }) => {
    const { t } = useStrings()
    const p = t.plansAdmin

    const labelInput = useTc<ValueElement>({
        onChange: (value: unknown) => onChange(row.rowId, { label: String(value ?? '') }),
    })

    const typeSelect = useTc<ValueElement>({
        items: SALES_FIELD_TYPES.map((type) => ({ key: type, label: p.fieldTypes[type] })),
        onChange: (value: string) => onChange(row.rowId, { type: (value || 'text') as SalesFieldType }),
    })

    const syncedRowId = useRef('')

    useEffect(() => {
        if (syncedRowId.current === row.rowId) return
        syncedRowId.current = row.rowId

        const label = row.label
        const type = row.type
        const frame = requestAnimationFrame(() => {
            if (labelInput.current) labelInput.current.value = label
            if (typeSelect.current) typeSelect.current.value = type
        })
        return () => cancelAnimationFrame(frame)
    }, [row.rowId, row.label, row.type, labelInput, typeSelect])

    return (
        <div className="modal-plan__field">
            <span className="modal-plan__field-index">{index + 1}</span>

            <tc-form-input
                ref={labelInput}
                type="text"
                label={p.fieldLabelLabel}
                placeholder={p.fieldLabelPlaceholder}
            ></tc-form-input>

            <div className="modal-plan__field-type">
                <tc-label>{p.fieldTypeLabel}</tc-label>
                <tc-extended-select ref={typeSelect}></tc-extended-select>
            </div>

            <tc-switch
                checked={row.required || undefined}
                label={p.fieldRequiredLabel}
                onClick={() => onChange(row.rowId, { required: !row.required })}
            ></tc-switch>

            <tc-button
                variant="danger"
                outline
                size="sm"
                onClick={() => onRemove(row.rowId)}
            >
                {p.fieldRemove}
            </tc-button>
        </div>
    )
}

const PlanModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.PLAN_EDITOR)
    const editing = useModalInput<Plan | null>(MODAL.PLAN_EDITOR)
    const { t } = useStrings()
    const p = t.plansAdmin

    const roles = useStore((state) => state.roles)
    const createPlan = useStore((state) => state.createPlan)
    const updatePlan = useStore((state) => state.updatePlan)
    const deletePlan = useStore((state) => state.deletePlan)

    const [draft, setDraft] = useState<PlanDraft>(EMPTY)
    const [saving, setSaving] = useState(false)

    const [fieldRows, setFieldRows] = useState<FieldRow[]>([])
    const nextRowId = useRef(0)

    const featuresRef = useRef<ValueElement | null>(null)
    const nameRef = useRef<ValueElement | null>(null)
    const priceRef = useRef<ValueElement | null>(null)
    const currencyRef = useRef<ValueElement | null>(null)
    const descriptionRef = useRef<ValueElement | null>(null)
    const featuresValue = useRef('')

    const modeSelect = useTc<ValueElement>({
        items: PLAN_MODES.map((mode) => ({ key: mode, label: mode === 'manual' ? p.modeManual : p.modeManaged })),
        onChange: (next: string) => setDraft((current) => ({ ...current, mode: next as PlanMode })),
    })

    const intervalSelect = useTc<ValueElement>({
        items: BILLING_INTERVALS.map((interval) => ({
            key: interval,
            label: interval === 'year' ? p.intervalYear : p.intervalMonth,
        })),
        onChange: (next: string) => setDraft((current) => ({ ...current, interval: next as Plan['interval'] })),
    })

    const roleSelect = useTc<ValueElement>({
        items: [
            { key: '', label: t.accessAdmin.unbound },
            ...roles.flatMap((role) => (role.id !== OWNER_ROLE_ID ? [{ key: role.id, label: role.name }] : [])),
        ],
        onChange: (next: string) => setDraft((current) => ({ ...current, roleId: next || null })),
    })

    useEffect(() => {
        if (!isOpen) return
        const next: PlanDraft = editing
            ? {
                name: editing.name,
                description: editing.description,
                roleId: editing.roleId,
                mode: editing.mode,
                priceCents: editing.priceCents,
                currency: editing.currency,
                interval: editing.interval,
                position: editing.position,
                active: editing.active,
                features: editing.features,
                salesFields: editing.salesFields,
            }
            : EMPTY
        setDraft(next)
        featuresValue.current = toLines(next.features ?? [])
        setFieldRows(toRows(next.salesFields ?? []))

        const frame = requestAnimationFrame(() => {
            if (modeSelect.current) modeSelect.current.value = next.mode ?? 'manual'
            if (intervalSelect.current) intervalSelect.current.value = next.interval ?? 'month'
            if (roleSelect.current) roleSelect.current.value = next.roleId ?? ''
            if (featuresRef.current) featuresRef.current.value = featuresValue.current
            if (nameRef.current) nameRef.current.value = next.name
            if (priceRef.current) priceRef.current.value = String(next.priceCents ?? 0)
            if (currencyRef.current) currencyRef.current.value = next.currency ?? 'USD'
            if (descriptionRef.current) descriptionRef.current.value = next.description ?? ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, editing, modeSelect, intervalSelect, roleSelect])

    const updateRow = (rowId: string, patch: Partial<SalesField>) => {
        setFieldRows((rows) => rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)))
    }

    const removeRow = (rowId: string) => {
        setFieldRows((rows) => rows.filter((row) => row.rowId !== rowId))
    }

    const addRow = () => {
        if (fieldRows.length >= MAX_FIELDS) return
        nextRowId.current += 1
        const rowId = `new-${nextRowId.current}`
        setFieldRows((rows) => [...rows, { rowId, key: '', label: '', type: 'text', required: false }])
    }

    const valid = draft.name.trim().length > 0

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const payload: PlanDraft = {
                ...draft,
                features: parseFeatures(featuresValue.current),
                salesFields: toSalesFields(fieldRows),
            }
            const saved = editing ? await updatePlan(editing.id, payload) : await createPlan(payload)
            if (saved) closeModal({ planId: saved.id })
        } finally {
            setSaving(false)
        }
    }

    const remove = async () => {
        if (!editing) return
        if (!window.confirm(p.deletePrompt(editing.name))) return
        if (await deletePlan(editing.id)) closeModal(null)
    }

    return (
        <div className="modal-plan">
            <tc-stack direction="column" gap="1rem">
                <div className="modal-plan__grid">
                    <tc-form-input
                        ref={nameRef}
                        type="text"
                        label={p.nameLabel}
                        onInput={(event: React.FormEvent<ValueElement>) =>
                            setDraft((current) => ({ ...current, name: String((event.target as ValueElement).value ?? '') }))
                        }
                    ></tc-form-input>

                    <div>
                        <tc-label>{p.modeLabel}</tc-label>
                        <tc-extended-select ref={modeSelect}></tc-extended-select>
                        <tc-helper-text>{p.modeHint}</tc-helper-text>
                    </div>

                    <tc-form-input
                        ref={priceRef}
                        type="number"
                        label={p.priceLabel}
                        onInput={(event: React.FormEvent<ValueElement>) =>
                            setDraft((current) => ({
                                ...current,
                                priceCents: Number((event.target as ValueElement).value ?? 0) || 0,
                            }))
                        }
                    ></tc-form-input>

                    <tc-form-input
                        ref={currencyRef}
                        type="text"
                        label={p.currencyLabel}
                        onInput={(event: React.FormEvent<ValueElement>) =>
                            setDraft((current) => ({
                                ...current,
                                currency: String((event.target as ValueElement).value ?? '').toUpperCase().slice(0, 3),
                            }))
                        }
                    ></tc-form-input>

                    <div>
                        <tc-label>{p.intervalLabel}</tc-label>
                        <tc-extended-select ref={intervalSelect}></tc-extended-select>
                    </div>

                    <div>
                        <tc-label>{p.roleLabel}</tc-label>
                        <tc-extended-select
                            ref={roleSelect}
                            search-placeholder={t.common.search}
                            no-results-text={t.common.noResults}
                        ></tc-extended-select>
                        <tc-helper-text>{p.roleHint}</tc-helper-text>
                    </div>
                </div>

                <tc-textarea
                    ref={descriptionRef}
                    label={p.descriptionLabel}
                    rows="2"
                    onInput={(event: React.FormEvent<ValueElement>) =>
                        setDraft((current) => ({ ...current, description: String((event.target as ValueElement).value ?? '') }))
                    }
                ></tc-textarea>

                <tc-textarea
                    ref={featuresRef}
                    label={p.featuresLabel}
                    help={p.featuresHint}
                    rows="3"
                    onInput={(event: React.FormEvent<ValueElement>) => {
                        featuresValue.current = String((event.target as ValueElement).value ?? '')
                    }}
                ></tc-textarea>

                <div className="modal-plan__fields">
                    <tc-label>{p.salesFieldsLabel}</tc-label>
                    <tc-helper-text>{p.salesFieldsHint}</tc-helper-text>

                    <div className="modal-plan__field-list">
                        {fieldRows.length === 0
                            ? <tc-text variant="muted">{p.fieldsEmpty}</tc-text>
                            : fieldRows.map((row, index) => (
                                <SalesFieldRow
                                    key={row.rowId}
                                    row={row}
                                    index={index}
                                    onChange={updateRow}
                                    onRemove={removeRow}
                                />
                            ))}
                    </div>

                    <div>
                        <tc-button
                            variant="secondary"
                            outline
                            disabled={fieldRows.length >= MAX_FIELDS || undefined}
                            onClick={addRow}
                        >
                            {p.fieldAdd}
                        </tc-button>
                    </div>
                </div>

                <tc-switch
                    checked={draft.active || undefined}
                    label={p.activeLabel}
                    help={p.activeHint}
                    onClick={() => setDraft((current) => ({ ...current, active: !current.active }))}
                ></tc-switch>

                <div className="modal-plan__actions">
                    {editing && (
                        <tc-button variant="danger" outline onClick={remove}>
                            {p.delete}
                        </tc-button>
                    )}
                    <span className="modal-plan__spacer" />
                    <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                        {p.cancel}
                    </tc-button>
                    <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                        {p.save}
                    </tc-button>
                </div>
            </tc-stack>
        </div>
    )
}

export default PlanModal
