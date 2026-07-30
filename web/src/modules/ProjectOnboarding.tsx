import React from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'

const ProjectOnboarding: React.FC = () => {
    const { t } = useStrings()
    const p = t.projects
    const navigate = useNavigate()
    const canCreate = useCan('project.create')


    return (
        <div className="module module-project-onboarding">
            <tc-section-card title={p.onboardingTitle}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{p.onboardingIntro}</tc-text>
                    {canCreate ? (
                        <tc-button variant="primary" onClick={() => navigate('/projects/new')}>
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
