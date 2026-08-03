import React, { useEffect, useReducer, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useProjectCan } from 'hooks/useProjectCan'
import { useTc } from '@toolcase/web-components/react'
import ChoiceCards, { ChoiceCardOption } from 'components/ChoiceCards'
import FloatingActionBar from 'components/FloatingActionBar'
import { DEFAULT_PROJECT_ICON, GENRE_BY_KEY, PROJECT_COLORS, PROJECT_ICONS, genresFor } from 'configs/genres'
import { AppType, Project } from 'types'

type ValueElement = HTMLElement & { value?: string }

type SettingsDraft = {
    name: string
    appType: AppType
    genre: string
    icon: string
    color: string
}

const toDraft = (project: Project): SettingsDraft => ({
    name: project.name,
    appType: project.appType,
    genre: project.genre,
    icon: project.icon,
    color: project.color,
})

const draftReducer = (draft: SettingsDraft, patch: Partial<SettingsDraft>): SettingsDraft => ({ ...draft, ...patch })

const ProjectSettingsGeneral: React.FC<{ project: Project }> = ({ project }) => {
    const { t } = useStrings()
    const p = t.projects
    const w = t.projectWizard
    const updateProject = useStore((state) => state.updateProject)
    const canWrite = useProjectCan('project.settings')

    const [draft, updateDraft] = useReducer(draftReducer, project, toDraft)
    const description = useRef(project.description)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    const patchDraft = (patch: Partial<SettingsDraft>) => {
        updateDraft(patch)
        setDirty(true)
    }

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
        defaultValue: project.name,
        onChange: (value: unknown) => patchDraft({ name: String(value ?? '') }),
    })
    const descriptionEditor = useTc<ValueElement>({
        onChange: (value: string) => {
            description.current = value ?? ''
            setDirty(true)
        },
    })
    const genreSelect = useTc<ValueElement>({
        items: genresFor(draft.appType).map((entry) => ({
            key: entry.key,
            label: entry.label,
            description: entry.description,
        })),
        onChange: (value: unknown) => {
            const key = String(value ?? '')
            patchDraft({ genre: key })
            const picked = GENRE_BY_KEY[key]
            if (picked?.icon) patchDraft({ icon: picked.icon })
        },
    })
    const iconPicker = useTc<HTMLElement>({
        icons: PROJECT_ICONS,
        onChange: (next: string) => patchDraft({ icon: next || DEFAULT_PROJECT_ICON }),
    })
    const colorPicker = useTc<HTMLElement>({
        colors: PROJECT_COLORS,
        onChange: (next: string) => patchDraft({ color: next || '' }),
    })

    useEffect(() => {
        if (nameInput.current) nameInput.current.value = project.name
        if (descriptionEditor.current) descriptionEditor.current.value = project.description
        if (genreSelect.current) genreSelect.current.value = project.genre
        setDirty(false)
    }, [project, nameInput, descriptionEditor, genreSelect])

    const valid = draft.name.trim().length > 0 && draft.name.trim().length <= 200

    const handleSave = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const ok = await updateProject(project.id, {
                name: draft.name.trim(),
                description: description.current.trim(),
                appType: draft.appType,
                genre: draft.genre,
                icon: draft.icon,
                color: draft.color,
            })
            if (ok) setDirty(false)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="project-settings">
            <div className="project-settings__form">
                <tc-panel bordered className="module-project-detail__settings-panel">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-form-input
                            ref={nameInput}
                            type="text"
                            label={p.nameLabel}
                            placeholder={p.namePlaceholder}
                            disabled={!canWrite || undefined}
                        ></tc-form-input>

                        <div>
                            <tc-label>{p.appTypeLabel}</tc-label>
                            <ChoiceCards
                                options={appTypeOptions}
                                value={draft.appType}
                                onChange={(next) => {
                                    if (!canWrite) return
                                    const appType = next as AppType
                                    const keepGenre =
                                        !draft.genre ||
                                        genresFor(appType).some((entry) => entry.key === draft.genre)
                                    patchDraft(keepGenre ? { appType } : { appType, genre: '' })
                                    if (!keepGenre && genreSelect.current) genreSelect.current.value = ''
                                }}
                                label={p.appTypeLabel}
                            />
                        </div>

                        <tc-row gutter="3">
                            <tc-col span="12" span-md="6">
                                <tc-label>{w.genreLabel}</tc-label>
                                <tc-extended-select
                                    ref={genreSelect}
                                    placeholder={w.genrePlaceholder}
                                    search-placeholder={w.genreSearch}
                                    max-height="260"
                                    disabled={!canWrite || undefined}
                                ></tc-extended-select>
                                <tc-helper-text icon="Wand">{w.genreHint}</tc-helper-text>
                            </tc-col>
                            <tc-col span="12" span-md="3">
                                <tc-label>{p.iconLabel}</tc-label>
                                <tc-icon-picker
                                    ref={iconPicker}
                                    value={draft.icon}
                                    disabled={!canWrite || undefined}
                                ></tc-icon-picker>
                                <tc-helper-text icon="Info">{w.iconHint}</tc-helper-text>
                            </tc-col>
                            <tc-col span="12" span-md="3">
                                <tc-label>{p.colorLabel}</tc-label>
                                <tc-color-picker
                                    ref={colorPicker}
                                    value={draft.color || undefined}
                                    disabled={!canWrite || undefined}
                                ></tc-color-picker>
                                <tc-helper-text icon="Info">{w.colorHint}</tc-helper-text>
                            </tc-col>
                        </tc-row>

                        <tc-markdown-editor
                            ref={descriptionEditor}
                            label={p.descriptionLabel}
                            placeholder={p.descriptionPlaceholder}
                            height="200"
                            disabled={!canWrite || undefined}
                        ></tc-markdown-editor>

                    </tc-stack>
                </tc-panel>
            </div>

            <FloatingActionBar label={p.unsavedHint} visible={dirty}>
                {canWrite && (
                    <tc-button
                        key="save"
                        variant="primary"
                        disabled={!valid || saving || undefined}
                        onClick={handleSave}
                    >
                        {p.save}
                    </tc-button>
                )}
            </FloatingActionBar>
        </div>
    )
}

export default ProjectSettingsGeneral
