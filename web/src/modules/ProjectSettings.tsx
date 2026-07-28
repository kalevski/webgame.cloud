import React, { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useIsProjectOwner, useProjectCan } from 'hooks/useProjectCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { AppType, Project } from 'types'

type ValueElement = HTMLElement & { value?: string }

const ICON_OPTIONS = [
    { value: 'Gamepad2', label: 'Gamepad' },
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
    appType: AppType
    icon: string
    color: string
}

const toDraft = (project: Project): ProjectDraft => ({
    name: project.name,
    appType: project.appType,
    icon: project.icon,
    color: project.color,
})

const draftReducer = (draft: ProjectDraft, patch: Partial<ProjectDraft>): ProjectDraft => ({ ...draft, ...patch })

const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const p = t.projects
    const updateProject = useStore((state) => state.updateProject)
    const deleteProject = useStore((state) => state.deleteProject)
    const canWrite = useProjectCan('project.settings')

    const isOwner = useIsProjectOwner()
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
    const typeGroup = useTc<HTMLElement>({
        options: [
            { value: 'game', label: p.appTypeGame },
            { value: 'app', label: p.appTypeApp },
            { value: 'prototype', label: p.appTypePrototype },
        ],
        onChange: (next: string) => updateDraft({ appType: (next as AppType) || 'game' }),
    })
    const iconPicker = useTc<HTMLElement>({
        icons: ICON_OPTIONS,
        onChange: (next: string) => updateDraft({ icon: next || 'Gamepad2' }),
    })
    const colorPicker = useTc<HTMLElement>({
        colors: COLOR_OPTIONS,
        onChange: (next: string) => updateDraft({ color: next || '' }),
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
                appType: draft.appType,
                icon: draft.icon,
                color: draft.color,
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

    const openArchive = useModalOpen<boolean, Project>(MODAL.ARCHIVE_PROJECT)
    const openTransfer = useModalOpen<boolean, Project>(MODAL.TRANSFER_PROJECT)
    const openLeave = useModalOpen<boolean, Project>(MODAL.LEAVE_PROJECT, (left) => {
        if (left) navigate('/projects')
    })

    const dangerZone = useTc<HTMLElement>({
        actions: [
            {
                key: 'archive',
                title: project.archivedAt ? p.unarchive : p.archive,
                description: p.archivedBanner,
                buttonLabel: project.archivedAt ? p.unarchive : p.archive,
                icon: 'Archive',
            },
            {
                key: 'transfer',
                title: p.transfer,
                description: p.transferHint,
                buttonLabel: p.transfer,
                icon: 'UserCheck',
            },
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
            if (key === 'archive') openArchive(project)
            if (key === 'transfer') openTransfer(project)
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
                        ref={typeGroup}
                        label={p.appTypeLabel}
                        value={draft.appType}
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

                    {canWrite && (
                        <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={handleSave}>
                            {p.save}
                        </tc-button>
                    )}
                </tc-stack>
            </tc-panel>

            {isOwner && <tc-danger-zone-actions ref={dangerZone}></tc-danger-zone-actions>}

            {!isOwner && (
                <tc-button variant="danger" outline onClick={() => openLeave(project)}>
                    {p.leave}
                </tc-button>
            )}
        </div>
    )
}

export default ProjectSettings
