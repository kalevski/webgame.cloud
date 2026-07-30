import React from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useIsProjectOwner } from 'hooks/useProjectCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { Project } from 'types'

const ProjectSettingsDanger: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const p = t.projects
    const deleteProject = useStore((state) => state.deleteProject)
    const isOwner = useIsProjectOwner()

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
        <div className="project-settings">
            <div className="project-settings__form">
                {isOwner ? (
                    <tc-danger-zone-actions ref={dangerZone}></tc-danger-zone-actions>
                ) : (
                    <tc-button variant="danger" outline onClick={() => openLeave(project)}>
                        {p.leave}
                    </tc-button>
                )}
            </div>
        </div>
    )
}

export default ProjectSettingsDanger
