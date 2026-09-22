import { useStore } from 'state'
import { FEATURE_FLAG_DEFAULTS, FeatureFlag } from 'types'

const useFeatureGate = (flag: FeatureFlag): boolean | null => {
    const authConfig = useStore((state) => state.authConfig)
    if (!authConfig) return null
    return authConfig.features?.[flag] ?? FEATURE_FLAG_DEFAULTS[flag]
}

export default useFeatureGate
