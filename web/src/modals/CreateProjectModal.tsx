import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { detailValue, useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { AppType, ProjectDraft } from 'types'
import { useModalClose } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const NO_TAGS: string[] = []

const tagsFrom = (event: Event): string[] => detailValue<string[]>(event as CustomEvent) ?? []

const CreateProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const createProject = useStore((state) => state.createProject)
    const { t } = useStrings()
    const p = t.projects

    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [appType, setAppType] = useState<AppType>('game')
    const [icon, setIcon] = useState('gamepad-2')
    const [color, setColor] = useState('')
    const [categories, setCategories] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [buildTags, setBuildTags] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const descriptionInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setDescription(String(value ?? '')),
    })
    const typeCards = useTc<ValueElement>({
        options: [
            { key: 'game', label: p.appTypeGame },
            { key: 'app', label: p.appTypeApp },
            { key: 'prototype', label: p.appTypePrototype },
        ],
        defaultValue: 'game',
        onChange: (value: unknown) => setAppType(String(value ?? 'game') as AppType),
    })
    const categoryInput = useTc<ValueElement>(
        { defaultValue: NO_TAGS },
        { 'tc-change': (event: Event) => setCategories(tagsFrom(event)) }
    )
    const tagInput = useTc<ValueElement>(
        { defaultValue: NO_TAGS },
        { 'tc-change': (event: Event) => setTags(tagsFrom(event)) }
    )
    const buildTagInput = useTc<ValueElement>(
        { defaultValue: NO_TAGS },
        { 'tc-change': (event: Event) => setBuildTags(tagsFrom(event)) }
    )
    const stepper = useTc<ValueElement>({
        steps: [
            { key: 'project', label: p.stepProject, description: p.stepProjectHint },
            { key: 'configuration', label: p.stepConfiguration, description: p.stepConfigurationHint },
            { key: 'review', label: p.stepReview, description: p.stepReviewHint },
        ],
    })
    const iconPicker = useTc<ValueElement>({
        icons: [
            { value: 'gamepad-2', label: 'Gamepad' },
            { value: 'rocket', label: 'Rocket' },
            { value: 'swords', label: 'Swords' },
            { value: 'ghost', label: 'Ghost' },
            { value: 'dice-5', label: 'Dice' },
            { value: 'joystick', label: 'Joystick' },
        ],
        defaultValue: 'gamepad-2',
        onChange: (value: unknown) => setIcon(String(value ?? 'gamepad-2')),
    })
    const colorPicker = useTc<ValueElement>({
        colors: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
        onChange: (value: unknown) => setColor(String(value ?? '')),
    })
    const review = useTc<ValueElement>({
        badges: [
            { label: p.nameLabel, value: name },
            { label: p.appTypeLabel, value: appType },
            { label: p.categoriesLabel, value: String(categories.length) },
            { label: p.tagsLabel, value: String(tags.length) },
            { label: p.buildTagsLabel, value: String(buildTags.length) },
        ],
    })

    const canAdvance = step === 0 ? name.trim().length > 0 : step === 1 ? categories.length > 0 : true

    const submit = async () => {
        setSaving(true)
        const draft: ProjectDraft = {
            name: name.trim(),
            description: description.trim(),
            appType,
            icon,
            color,
            categories,
            tags,
            buildTags,
        }
        const created = await createProject(draft)
        setSaving(false)
        if (created) closeModal(created)
    }

    return (
        <>
            <div className="modal-wizard__stepper">
                <tc-stepper ref={stepper} active-step={['project', 'configuration', 'review'][step]} />
            </div>

            <div hidden={step !== 0 || undefined}>
                <tc-form-input ref={nameInput} label={p.nameLabel} placeholder={p.namePlaceholder} required />
                <tc-form-input ref={descriptionInput} label={p.descriptionLabel} placeholder={p.descriptionPlaceholder} />
                <tc-label>{p.appTypeLabel}</tc-label>
                <tc-card-options ref={typeCards} />
                <tc-icon-picker ref={iconPicker} label={p.iconLabel}></tc-icon-picker>
                <tc-color-picker ref={colorPicker} label={p.colorLabel}></tc-color-picker>
            </div>

            <div hidden={step !== 1 || undefined}>
                <tc-tag-input ref={categoryInput} label={p.categoriesLabel} help={p.categoriesHint} allow-create />
                <tc-tag-input ref={tagInput} label={p.tagsLabel} help={p.tagsHint} allow-create />
                <tc-tag-input ref={buildTagInput} label={p.buildTagsLabel} help={p.buildTagsHint} allow-create />
            </div>

            <div hidden={step !== 2 || undefined}>
                <tc-badge-row ref={review} />
            </div>

            <tc-button
                slot="footer"
                variant="secondary"
                outline
                hidden={step === 0 || undefined}
                onClick={() => setStep(step - 1)}
            >
                {t.modal.back}
            </tc-button>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={(step < 2 ? !canAdvance : saving) || undefined}
                onClick={step < 2 ? () => setStep(step + 1) : submit}
            >
                {step < 2 ? t.modal.next : p.create}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateProjectModal
