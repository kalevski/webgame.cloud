import React, { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { Project, ProjectVisibility } from 'types'

type ValueElement = HTMLElement & { value?: string }

const ICON_OPTIONS = [
    { value: 'FolderKanban', label: 'Folder' },
    { value: 'Rocket', label: 'Rocket' },
    { value: 'Target', label: 'Target' },
    { value: 'Flag', label: 'Flag' },
    { value: 'Lightbulb', label: 'Idea' },
    { value: 'Layers', label: 'Layers' },
    { value: 'Briefcase', label: 'Briefcase' },
    { value: 'Zap', label: 'Zap' },
]

const COLOR_OPTIONS = [
    '#7c3aed', // violet
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#3b82f6', // blue
    '#64748b', // slate
    '#f43f5e', // rose
]

type ProjectDraft = {
    name: string
    visibility: ProjectVisibility
    icon: string
    color: string
    priority: number
    dueDate: string
    notifyOnActivity: boolean
}

const toDraft = (project: Project): ProjectDraft => ({
    name: project.name,
    visibility: project.visibility,
    icon: project.icon,
    color: project.color,
    priority: project.priority,
    dueDate: project.dueDate ?? '',
    notifyOnActivity: project.notifyOnActivity,
})

const draftReducer = (draft: ProjectDraft, patch: Partial<ProjectDraft>): ProjectDraft => ({ ...draft, ...patch })

const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const p = t.projects
    const updateProject = useStore((state) => state.updateProject)
    const deleteProject = useStore((state) => state.deleteProject)
    const canWrite = useCan('project.write')

    const [draft, updateDraft] = useReducer(draftReducer, project, toDraft)
    const description = useRef(project.description)
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: project.name,
        onChange: (value: unknown) => updateDraft({ name: String(value ?? '') }),
    })
    const descriptionEditor = useTc<ValueElement>({
        onChange: (value: string) => {
            description.current = value ?? ''
        },
    })
    const visibilityGroup = useTc<HTMLElement>({
        options: [
            { value: 'private', label: p.visibilityPrivate },
            { value: 'shared', label: p.visibilityShared },
        ],
        onChange: (next: string) => updateDraft({ visibility: (next as ProjectVisibility) || 'private' }),
    })
    const iconPicker = useTc<HTMLElement>({
        icons: ICON_OPTIONS,
        onChange: (next: string) => updateDraft({ icon: next || 'FolderKanban' }),
    })
    const colorPicker = useTc<HTMLElement>({
        colors: COLOR_OPTIONS,
        onChange: (next: string) => updateDraft({ color: next || '' }),
    })
    const priorityRating = useTc<HTMLElement>({
        onChange: (next: number) => updateDraft({ priority: next || 1 }),
    })
    const dueDatePicker = useTc<HTMLElement>({
        onChange: (next: string) => updateDraft({ dueDate: next || '' }),
    })
    const notifySwitch = useTc<HTMLElement>({
        onChange: (next: boolean) => updateDraft({ notifyOnActivity: !!next }),
    })

    useEffect(() => {
        if (nameInput.current) nameInput.current.value = project.name
        if (descriptionEditor.current) descriptionEditor.current.value = project.description
    }, [project, nameInput, descriptionEditor])

    const valid = draft.name.trim().length > 0 && draft.name.trim().length <= 200

    const handleSave = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            await updateProject(project.id, {
                name: draft.name.trim(),
                description: description.current.trim(),
                visibility: draft.visibility,
                icon: draft.icon,
                color: draft.color,
                priority: draft.priority,
                dueDate: draft.dueDate || null,
                notifyOnActivity: draft.notifyOnActivity,
            })
        } finally {
            setSaving(false)
        }
    }

    const openConfirmDelete = useModalOpen<Project, Project>(MODAL.CONFIRM_DELETE_PROJECT, async (confirmed) => {
        if (!confirmed) return
        const ok = await deleteProject(confirmed.id)
        if (ok) navigate('/projects')
    })

    const dangerZone = useTc<HTMLElement>({
        actions: [
            {
                key: 'delete',
                title: p.dangerZone,
                description: p.deleteProjectHint,
                buttonLabel: p.delete,
                icon: 'Trash2',
            },
        ],
        onactionclick: (key: string) => {
            if (key === 'delete') openConfirmDelete(project)
        },
    })

    return (
        <div className="module-project-detail__settings">
            <tc-panel bordered className="module-project-detail__settings-panel">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-form-input
                        ref={nameInput}
                        type="text"
                        label={p.nameLabel}
                        placeholder={p.namePlaceholder}
                        disabled={!canWrite || undefined}
                    ></tc-form-input>

                    <tc-markdown-editor
                        ref={descriptionEditor}
                        label={p.descriptionLabel}
                        placeholder={p.descriptionPlaceholder}
                        height="180px"
                        disabled={!canWrite || undefined}
                    ></tc-markdown-editor>

                    <tc-radio-group
                        ref={visibilityGroup}
                        label={p.visibilityLabel}
                        value={draft.visibility}
                        inline
                        disabled={!canWrite || undefined}
                    ></tc-radio-group>

                    <tc-row g="3">
                        <tc-col md="6">
                            <tc-icon-picker
                                ref={iconPicker}
                                label={p.iconLabel}
                                value={draft.icon}
                                disabled={!canWrite || undefined}
                            ></tc-icon-picker>
                        </tc-col>
                        <tc-col md="6">
                            <tc-color-picker
                                ref={colorPicker}
                                label={p.colorLabel}
                                value={draft.color || undefined}
                                disabled={!canWrite || undefined}
                            ></tc-color-picker>
                        </tc-col>
                    </tc-row>

                    <tc-row g="3">
                        <tc-col md="6">
                            <div>
                                <tc-tooltip title={p.priorityHint}>
                                    <tc-label>{p.priorityLabel}</tc-label>
                                </tc-tooltip>
                                <tc-rating ref={priorityRating} count={5} value={draft.priority} read-only={!canWrite || undefined}></tc-rating>
                            </div>
                        </tc-col>
                        <tc-col md="6">
                            <tc-date-picker
                                ref={dueDatePicker}
                                label={p.dueDateLabel}
                                value={draft.dueDate || undefined}
                                disabled={!canWrite || undefined}
                            ></tc-date-picker>
                        </tc-col>
                    </tc-row>

                    <tc-switch
                        ref={notifySwitch}
                        label={p.notifyLabel}
                        help={p.notifyHelp}
                        checked={draft.notifyOnActivity || undefined}
                        disabled={!canWrite || undefined}
                    ></tc-switch>

                    {canWrite && (
                        <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={handleSave}>
                            {p.save}
                        </tc-button>
                    )}
                </tc-stack>
            </tc-panel>

            {canWrite && <tc-danger-zone-actions ref={dangerZone}></tc-danger-zone-actions>}
        </div>
    )
}

export default ProjectSettings
