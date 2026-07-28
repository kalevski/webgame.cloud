import { useStore } from 'state'
import { ProjectPermission } from 'types'

export const useProjectPermissions = (): ProjectPermission[] => {
    const projects = useStore((state) => state.projects)
    const activeId = useStore((state) => state.activeProjectId)
    return projects.find((project) => project.id === activeId)?.permissions ?? []
}

export const useProjectCan = (permission: ProjectPermission): boolean =>
    useProjectPermissions().includes(permission)

export const useIsProjectOwner = (): boolean => {
    const projects = useStore((state) => state.projects)
    const activeId = useStore((state) => state.activeProjectId)
    return projects.find((project) => project.id === activeId)?.isOwner ?? false
}

export default useProjectCan
