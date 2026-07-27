import { useStore } from 'state'
import { Permission, ResolvedLimits } from 'types'

const useCan = (permission: Permission): boolean =>
    useStore((state) => state.permissions.includes(permission))

export const useResourceLimits = (): ResolvedLimits => useStore((state) => state.resourceLimits)

export default useCan
