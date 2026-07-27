import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc, useTcEvents, detailValue } from '@toolcase/web-components/react'
import { isIntInRange, isOneOf, isRequiredText } from 'helpers/validation'
import { ProjectVisibility } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

const VISIBILITIES = ['private', 'shared'] as const

export type CreateProjectResult = {
    name: string
    description?: string
    visibility?: ProjectVisibility
    priority?: number
}

const CreateProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CREATE_PROJECT)
    const { t } = useStrings()
    const p = t.projects

    const [name, setName] = useState('')
    const description = useRef('')
    const descriptionEl = useRef<ValueElement | null>(null)

    const visibility = useRef<ProjectVisibility>('private')
    const [priority, setPriority] = useState(1)

    const nameInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })

    const visibilitySelect = useTcEvents<ValueElement>({
        'tc-change': (event: Event) => {
            const next = detailValue<string>(event as CustomEvent) ?? ''
            visibility.current = isOneOf(next, VISIBILITIES) ? next : 'private'
        },
    })
    const prioritySlider = useTc<HTMLElement>({
        onChange: (next: number) => setPriority(next || 1),
    })

    useEffect(() => {
        if (!isOpen) return
        setName('')
        description.current = ''
        visibility.current = 'private'
        setPriority(1)
        if (nameInput.current) nameInput.current.value = ''
        if (descriptionEl.current) descriptionEl.current.value = ''
        const el = visibilitySelect.current
        const frame = requestAnimationFrame(() => { if (el) el.value = 'private' })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, nameInput, visibilitySelect])

    const valid = isRequiredText(name, 200) && isIntInRange(priority, 1, 5)

    const handleConfirm = () => {
        if (!valid) return
        closeModal({
            name: name.trim(),
            description: description.current.trim() || undefined,
            visibility: visibility.current,
            priority,
        } satisfies CreateProjectResult)
    }

    return (
        <>
            <tc-stack direction="column" gap="0.85rem">
                <tc-form-input ref={nameInput} type="text" label={p.nameLabel} placeholder={p.namePlaceholder}></tc-form-input>
                <tc-textarea
                    ref={descriptionEl}
                    label={p.descriptionLabel}
                    placeholder={p.descriptionPlaceholder}
                    rows="3"
                    onInput={(event: React.FormEvent<ValueElement>) => {
                        description.current = String((event.target as ValueElement).value ?? '')
                    }}
                ></tc-textarea>
                <tc-select ref={visibilitySelect} label={p.visibilityLabel} value="private">
                    <tc-option value="private">{p.visibilityPrivate}</tc-option>
                    <tc-option value="shared">{p.visibilityShared}</tc-option>
                </tc-select>
                <tc-slider
                    ref={prioritySlider}
                    label={p.priorityLabel}
                    min="1"
                    max="5"
                    step="1"
                    value={priority}
                    show-tooltip
                ></tc-slider>
            </tc-stack>
            <tc-button slot="footer" variant="primary" disabled={!valid || undefined} onClick={handleConfirm}>
                {p.create}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateProjectModal
