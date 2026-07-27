import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { TaskStatus } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type CreateTaskResult = { title: string; status: TaskStatus }

const CreateTaskModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CREATE_TASK)
    const initialStatus = useModalInput<TaskStatus>(MODAL.CREATE_TASK)
    const { t } = useStrings()
    const p = t.projects

    const [title, setTitle] = useState('')

    const status = useRef<TaskStatus>('planned')

    const titleInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setTitle(String(value ?? '')),
    })
    const statusSelect = useTc<ValueElement>({
        items: [
            { key: 'planned', label: p.statusPlanned },
            { key: 'in-progress', label: p.statusInProgress },
            { key: 'shipped', label: p.statusShipped },
        ],
        value: initialStatus ?? 'planned',
        onChange: (next: string) => {
            status.current = (next as TaskStatus) || 'planned'
        },
    })

    useEffect(() => {
        if (!isOpen) return
        const initial = initialStatus ?? 'planned'
        setTitle('')
        status.current = initial
        if (titleInput.current) titleInput.current.value = ''
        const el = statusSelect.current
        const frame = requestAnimationFrame(() => { if (el) el.value = initial })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, initialStatus, titleInput, statusSelect])

    const valid = title.trim().length > 0 && title.trim().length <= 300

    const handleConfirm = () => {
        if (!valid) return
        closeModal({ title: title.trim(), status: status.current } satisfies CreateTaskResult)
    }

    return (
        <>
            <tc-stack direction="column" gap="0.85rem">
                <tc-form-input ref={titleInput} type="text" label={p.titleLabel} placeholder={p.taskPlaceholder}></tc-form-input>
                <div>
                    <tc-label>{p.statusLabel}</tc-label>
                    <tc-extended-select ref={statusSelect} placeholder={p.statusLabel}></tc-extended-select>
                </div>
            </tc-stack>
            <tc-button slot="footer" variant="primary" disabled={!valid || undefined} onClick={handleConfirm}>
                {p.addTask}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateTaskModal
