import React from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { Project } from 'types'

const ProjectOnboarding: React.FC = () => {
    const { t } = useStrings()
    const p = t.projects
    const navigate = useNavigate()
    const canCreate = useCan('project.create')

    const openWizard = useModalOpen<Project>(MODAL.CREATE_PROJECT, (created) => {
        if (created) navigate(`/projects/${created.id}/assets`)
    })

    return (
        <div className="module module-project-onboarding">
            <tc-section-card title={p.onboardingTitle}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{p.onboardingIntro}</tc-text>
                    {canCreate ? (
                        <tc-button variant="primary" onClick={() => openWizard()}>
                            {p.createNew}
                        </tc-button>
                    ) : (
                        <tc-alert variant="info">{p.onboardingNoPermission}</tc-alert>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default ProjectOnboarding
