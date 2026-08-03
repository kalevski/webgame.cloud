import { useMemo } from 'react'

const useStableValue = <T,>(value: T): T => {
    const signature = JSON.stringify(value ?? null)
    return useMemo(() => value, [signature])
}

export default useStableValue
