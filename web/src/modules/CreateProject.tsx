import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import { detailValue, useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import ChoiceCards, { ChoiceCardOption } from 'components/ChoiceCards'
import ProjectPreview from 'components/ProjectPreview'
import FloatingActionBar from 'components/FloatingActionBar'
import {
    DEFAULT_PROJECT_COLOR,
    DEFAULT_PROJECT_ICON,
    GENRE_BY_KEY,
    genresFor,
    PROJECT_COLORS,
    PROJECT_ICONS,
} from 'configs/genres'
import { randomProjectName } from 'helpers/projectName'
import { AppType, ProjectDraft } from 'types'

type ValueElement = HTMLElement & { value?: unknown }

const NO_TAGS: string[] = []

const STEP_KEYS = ['project', 'configuration', 'preview'] as const

const tagsFrom = (event: Event): string[] => detailValue<string[]>(event as CustomEvent) ?? []

const CreateProject: React.FC = () => {
    const navigate = useNavigate()
    const createProject = useStore((state) => state.createProject)
    const { t } = useStrings()
    const p = t.projects
    const w = t.projectWizard

    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [appType, setAppType] = useState<AppType>('game')
    const [genre, setGenre] = useState('')
    const [icon, setIcon] = useState(DEFAULT_PROJECT_ICON)
    const [color, setColor] = useState(DEFAULT_PROJECT_COLOR)
    const [categories, setCategories] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [buildTags, setBuildTags] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    const iconTouched = useRef(false)

    const appTypeOptions: ChoiceCardOption[] = [
        {
            key: 'game',
            name: p.appTypeGame,
            note: w.appTypeGameNote,
            icon: 'gamepad-2',
        },
        {
            key: 'app',
            name: p.appTypeApp,
            note: w.appTypeAppNote,
            icon: 'layout-dashboard',
        },
        {
            key: 'prototype',
            name: p.appTypePrototype,
            note: w.appTypePrototypeNote,
            icon: 'flask-conical',
        },
    ]

    const nameInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const descriptionEditor = useTc<ValueElement>({
        onChange: (value: unknown) => setDescription(String(value ?? '')),
    })
    const genreSelect = useTc<ValueElement>({
        items: genresFor(appType).map((entry) => ({
            key: entry.key,
            label: entry.label,
            description: entry.description,
        })),
        onChange: (value: unknown) => {
            const key = String(value ?? '')
            setGenre(key)
            const picked = GENRE_BY_KEY[key]
            if (!picked) return
            if (picked.icon && !iconTouched.current) setIcon(picked.icon)
            setTags((current) => [...new Set([...current, ...picked.tags])])
        },
    })
    const categoryInput = useTc<ValueElement>(
        { defaultValue: NO_TAGS, recommendations: w.categoryRecommendations },
        { 'tc-change': (event: Event) => setCategories(tagsFrom(event)) },
    )
    const tagInput = useTc<ValueElement>(
        { value: tags, recommendations: w.tagRecommendations },
        { 'tc-change': (event: Event) => setTags(tagsFrom(event)) },
    )
    const buildTagInput = useTc<ValueElement>(
        { defaultValue: NO_TAGS, recommendations: w.buildTagRecommendations },
        { 'tc-change': (event: Event) => setBuildTags(tagsFrom(event)) },
    )
    useEffect(() => {
        if (!genre || genresFor(appType).some((entry) => entry.key === genre)) return
        setGenre('')
        if (genreSelect.current) genreSelect.current.value = ''
    }, [appType, genre, genreSelect])

    const stepLabels = [p.stepProject, p.stepConfiguration, p.stepReview]

    const stepper = useTc<ValueElement>({
        steps: [
            { key: 'project', label: p.stepProject, description: null },
            { key: 'configuration', label: p.stepConfiguration, description: null },
            { key: 'preview', label: p.stepReview, description: null },
        ],
    })
    const iconPicker = useTc<ValueElement>({
        icons: PROJECT_ICONS,
        onChange: (value: unknown) => {
            iconTouched.current = true
            setIcon(String(value ?? DEFAULT_PROJECT_ICON))
        },
    })
    const colorPicker = useTc<ValueElement>({
        colors: PROJECT_COLORS,
        onChange: (value: unknown) => setColor(String(value ?? DEFAULT_PROJECT_COLOR)),
    })

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (iconPicker.current) iconPicker.current.value = icon
            if (colorPicker.current) colorPicker.current.value = color
        })
        return () => cancelAnimationFrame(frame)
    }, [icon, color, iconPicker, colorPicker])

    const rollName = () => {
        const next = randomProjectName()
        setName(next)
        if (nameInput.current) nameInput.current.value = next
    }

    const complete = name.trim().length > 0 && categories.length > 0
    const canAdvance = step === 0 ? name.trim().length > 0 : complete

    const submit = async () => {
        setSaving(true)
        const draft: ProjectDraft = {
            name: name.trim(),
            description: description.trim(),
            appType,
            genre,
            icon,
            color,
            categories,
            tags,
            buildTags,
        }
        try {
            const created = await createProject(draft)
            if (created) navigate(`/projects/${created.id}/assets`)
        } finally {
            setSaving(false)
        }
    }

    const preview = {
        name,
        description,
        appType,
        genre,
        icon,
        color,
        categories,
        tags,
        buildTags,
    }

    return (
        <>
            <div className="project-wizard">
                <div className="project-wizard__form">
                    <div className="project-wizard__stepper">
                        <tc-stepper ref={stepper} active-step={STEP_KEYS[step]} />
                    </div>

                    <tc-panel bordered className="project-wizard__panel">
                        <div hidden={step !== 0 || undefined}>
                            <tc-container fluid>
                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-label required>{p.nameLabel}</tc-label>
                                        <tc-input-group className="project-wizard__name-group">
                                            <tc-input ref={nameInput} placeholder={p.namePlaceholder} required />
                                            <tc-icon-button
                                                icon="Dices"
                                                variant="secondary"
                                                outline
                                                label={w.randomName}
                                                title={w.randomName}
                                                onClick={rollName}
                                            ></tc-icon-button>
                                        </tc-input-group>
                                        <tc-helper-text icon="Lightbulb">{w.nameHint}</tc-helper-text>
                                    </tc-col>
                                </tc-row>

                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-label>{p.appTypeLabel}</tc-label>
                                        <ChoiceCards
                                            options={appTypeOptions}
                                            value={appType}
                                            onChange={(next) => setAppType(next as AppType)}
                                            label={p.appTypeLabel}
                                        />
                                    </tc-col>
                                </tc-row>

                                <tc-row gutter="3">
                                    <tc-col span="12" span-md="6">
                                        <tc-label>{w.genreLabel}</tc-label>
                                        <tc-extended-select
                                            ref={genreSelect}
                                            placeholder={w.genrePlaceholder}
                                            search-placeholder={w.genreSearch}
                                            max-height="260"
                                        ></tc-extended-select>
                                        <tc-helper-text icon="Wand">{w.genreHint}</tc-helper-text>
                                    </tc-col>
                                    <tc-col span="6" span-md="3">
                                        <tc-label>{p.iconLabel}</tc-label>
                                        <tc-icon-picker ref={iconPicker}></tc-icon-picker>
                                        <tc-helper-text icon="Info">{w.iconHint}</tc-helper-text>
                                    </tc-col>
                                    <tc-col span="6" span-md="3">
                                        <tc-label>{p.colorLabel}</tc-label>
                                        <tc-color-picker ref={colorPicker}></tc-color-picker>
                                        <tc-helper-text icon="Info">{w.colorHint}</tc-helper-text>
                                    </tc-col>
                                </tc-row>

                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-markdown-editor
                                            ref={descriptionEditor}
                                            label={p.descriptionLabel}
                                            placeholder={p.descriptionPlaceholder}
                                            height="200"
                                        ></tc-markdown-editor>
                                        <tc-helper-text icon="Info">{w.descriptionHint}</tc-helper-text>
                                    </tc-col>
                                </tc-row>
                            </tc-container>
                        </div>

                        <div hidden={step !== 1 || undefined}>
                            <tc-alert variant="info">{w.configurationIntro}</tc-alert>

                            <tc-container fluid>
                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-tag-input
                                            ref={categoryInput}
                                            label={p.categoriesLabel}
                                            help={w.categoriesGuide}
                                            allow-create
                                        />
                                        <tc-helper-text icon="Lightbulb">{w.categoriesRecommendation}</tc-helper-text>
                                    </tc-col>
                                </tc-row>
                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-tag-input
                                            ref={tagInput}
                                            label={p.tagsLabel}
                                            help={w.tagsGuide}
                                            allow-create
                                        />
                                        <tc-helper-text icon="Lightbulb">{w.tagsRecommendation}</tc-helper-text>
                                    </tc-col>
                                </tc-row>
                                <tc-row gutter="3">
                                    <tc-col span="12">
                                        <tc-tag-input
                                            ref={buildTagInput}
                                            label={p.buildTagsLabel}
                                            help={w.buildTagsGuide}
                                            allow-create
                                        />
                                        <tc-helper-text icon="Lightbulb">{w.buildTagsRecommendation}</tc-helper-text>
                                    </tc-col>
                                </tc-row>
                            </tc-container>
                        </div>
                        <div hidden={step !== 2 || undefined}>
                            <tc-alert variant="info">{w.previewStepIntro}</tc-alert>
                            <ProjectPreview draft={preview} />
                        </div>

                    </tc-panel>
                </div>
            </div>

            <FloatingActionBar label={p.stepOf(step + 1, STEP_KEYS.length, stepLabels[step])}>
                {step > 0 && (
                    <tc-button key="back" variant="secondary" outline onClick={() => setStep(step - 1)}>
                        {t.modal.back}
                    </tc-button>
                )}
                {step < STEP_KEYS.length - 1 && (
                    <tc-button
                        key="next"
                        variant="secondary"
                        disabled={!canAdvance || undefined}
                        onClick={() => setStep(step + 1)}
                    >
                        {t.modal.next}
                    </tc-button>
                )}
                {step === STEP_KEYS.length - 1 && complete && (
                    <tc-button key="create" variant="primary" disabled={saving || undefined} onClick={submit}>
                        {p.create}
                    </tc-button>
                )}
                <tc-button key="cancel" variant="secondary" outline onClick={() => navigate(-1)}>
                    {t.modal.cancel}
                </tc-button>
            </FloatingActionBar>
        </>
    )
}

export default CreateProject
