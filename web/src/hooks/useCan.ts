import { useStore } from 'state'
import { Permission, ResolvedLimits } from 'types'

const useCan = (permission: Permission): boolean =>
    useStore((state) => state.permissions.includes(permission))

export const useCanAny = (...permissions: Permission[]): boolean =>
    useStore((state) => {
        const granted = new Set(state.permissions)
        return permissions.some((permission) => granted.has(permission))
    })

export const useResourceLimits = (): ResolvedLimits => useStore((state) => state.resourceLimits)

export default useCan
