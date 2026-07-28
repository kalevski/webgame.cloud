import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import useTcEvent from 'hooks/useTcEvent'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'
import { useProjectCan } from 'hooks/useProjectCan'
import { Project, ProjectMember } from 'types'

type Props = {
    project: Project
}

const ProjectMembers: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const m = t.members

    const members = useStore((state) => state.members)
    const invites = useStore((state) => state.invites)
    const fetchMembers = useStore((state) => state.fetchMembers)
    const fetchInvites = useStore((state) => state.fetchInvites)
    const removeMember = useStore((state) => state.removeMember)
    const revokeInvite = useStore((state) => state.revokeInvite)

    const canManage = useProjectCan('member.manage')
    const [tab, setTab] = useState<'members' | 'invites'>('members')

    useEffect(() => {
        void fetchMembers(project.id)
        void fetchInvites(project.id)
    }, [project.id, fetchMembers, fetchInvites])

    const openEdit = useModalOpen<boolean, { projectId: string; member: ProjectMember }>(
        MODAL.EDIT_MEMBER_PERMISSIONS,
        () => {
            void fetchMembers(project.id)
        }
    )
    const openRemove = useModalOpen<ProjectMember, ProjectMember>(MODAL.REMOVE_MEMBER, (member) => {
        if (member) void removeMember(project.id, member.id)
    })

    const memberList = useTc<HTMLElement>({
        actions: members.map((member) => ({
            key: member.id,
            title: `${member.name || member.email}${member.isOwner ? ` · ${m.owner}` : ''}`,
            description: member.isOwner
                ? member.email
                : `${member.email}${member.permissions.length > 0 ? ` · ${member.permissions.join(', ')}` : ''}`,
            label: member.isOwner || !canManage ? '' : m.editPermissions,
            variant: 'secondary',
            icon: member.isOwner || !canManage ? '' : 'Pencil',
        })),
    })

    useTcEvent<{ key: string }>(memberList, 'tc-action-click', ({ key }) => {
        const member = members.find((entry) => entry.id === key)
        if (member && !member.isOwner) openEdit({ projectId: project.id, member })
    })

    const inviteList = useTc<HTMLElement>({
        actions: invites.map((invite) => ({
            key: invite.id,
            title: invite.email,
            description: m.expires(invite.expiresAt.slice(0, 10)),
            label: canManage ? m.revoke : '',
            variant: 'danger',
            icon: canManage ? 'Trash2' : '',
        })),
    })

    useTcEvent<{ key: string }>(inviteList, 'tc-action-click', ({ key }) => {
        void revokeInvite(project.id, key)
    })

    return (
        <div className="module module-project-members">
            <tc-section-card>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-button-group>
                        <tc-button
                            variant={tab === 'members' ? 'primary' : 'secondary'}
                            outline={tab === 'members' ? undefined : true}
                            onClick={() => setTab('members')}
                        >
                            {m.tabMembers(members.length)}
                        </tc-button>
                        <tc-button
                            variant={tab === 'invites' ? 'primary' : 'secondary'}
                            outline={tab === 'invites' ? undefined : true}
                            onClick={() => setTab('invites')}
                        >
                            {m.tabInvites(invites.length)}
                        </tc-button>
                    </tc-button-group>

                    {tab === 'members' && members.length === 0 && (
                        <tc-empty-state icon="users">{m.emptyRoster}</tc-empty-state>
                    )}
                    {tab === 'members' && members.length > 0 && (
                        <tc-action-row-list ref={memberList} outline trailing-icon="none"></tc-action-row-list>
                    )}
                    {tab === 'members' && canManage && members.some((member) => !member.isOwner) && (
                        <div className="member-remove">
                            <span className="member-remove__caption">{m.removeCaption}</span>
                            <div className="member-remove__row">
                                {members.filter((member) => !member.isOwner).map((member) => (
                                    <tc-button
                                        key={member.id}
                                        variant="danger"
                                        outline
                                        size="sm"
                                        onClick={() => openRemove(member)}
                                    >
                                        {member.name || member.email}
                                    </tc-button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'invites' && invites.length === 0 && (
                        <tc-empty-state icon="mail">{m.emptyInvites}</tc-empty-state>
                    )}
                    {tab === 'invites' && invites.length > 0 && (
                        <tc-action-row-list ref={inviteList} outline trailing-icon="none"></tc-action-row-list>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default ProjectMembers
