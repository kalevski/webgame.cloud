import { useStore } from 'state'
import { FEATURE_FLAG_DEFAULTS, FeatureFlag } from 'types'

const useFeature = (flag: FeatureFlag): boolean => {
    const authConfig = useStore((state) => state.authConfig)
    return authConfig?.features?.[flag] ?? FEATURE_FLAG_DEFAULTS[flag]
}

export default useFeature
