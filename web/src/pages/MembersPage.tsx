import React, { useEffect } from 'react'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import ProjectMembers from 'modules/ProjectMembers'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'

const MembersPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const activeProjectId = useStore((state) => state.activeProjectId)
    const fetchMembers = useStore((state) => state.fetchMembers)

    const openInvite = useModalOpen<boolean, string>(MODAL.INVITE_MEMBER, () => {
        if (activeProjectId) void fetchMembers(activeProjectId)
    })

    useEffect(() => {
        setPageTitle(t.members.title)
        setPageDescription(t.members.pageDescription)
    }, [setPageTitle, setPageDescription, t.members.title, t.members.pageDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.members.title}
                pipeline={false}
                subline={(project) => (
                    <>
                        <strong>{project.memberCount}</strong>
                        {` ${project.memberCount === 1 ? t.members.memberWord : t.members.membersWord}`}
                    </>
                )}
                action={(project) =>
                    project.permissions.includes('member.manage') ? (
                        <tc-button variant="primary" onClick={() => openInvite(project.id)}>
                            {t.members.invite}
                        </tc-button>
                    ) : null
                }
            >
                {(project) => <ProjectMembers project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default MembersPage
