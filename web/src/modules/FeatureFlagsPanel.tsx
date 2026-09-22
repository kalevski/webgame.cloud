import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'
import { useTc } from '@toolcase/web-components/react'
import { FEATURE_FLAGS, FEATURE_FLAG_REQUIRES, FeatureFlag } from 'types'

type FlagCardProps = {
    flag: FeatureFlag
    checked: boolean
    label: string
    hint: string
    disabled: boolean
    onToggle: (flag: FeatureFlag, enabled: boolean) => void
}

const FlagCard: React.FC<FlagCardProps> = ({ flag, checked, label, hint, disabled, onToggle }) => {
    const card = useTc<HTMLElement>({
        onChange: (enabled: boolean) => onToggle(flag, enabled),
    })

    return (
        <tc-toggle-card
            ref={card}
            className="module-feature-flags__card"
            label={label}
            hint={hint}
            icon="flag"
            checked={checked || undefined}
            disabled={disabled || undefined}
        ></tc-toggle-card>
    )
}

const FeatureFlagsPanel: React.FC = () => {
    const { t } = useStrings()
    const f = t.featureFlags
    const featureFlags = useStore((state) => state.featureFlags)
    const fetchFeatureFlags = useStore((state) => state.fetchFeatureFlags)
    const saveFeatureFlag = useStore((state) => state.saveFeatureFlag)
    const fetchAuth = useStore((state) => state.fetchAuth)

    const canWrite = useCan('admin.feature.write')

    useEffect(() => {
        void fetchFeatureFlags()
    }, [fetchFeatureFlags])

    const handleToggle = async (flag: FeatureFlag, enabled: boolean) => {
        const saved = await saveFeatureFlag(flag, enabled)
        if (saved) void fetchAuth()
    }

    return (
        <div className="module module-feature-flags">
            <tc-section-card title={f.title} icon="ToggleRight">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{f.intro}</tc-text>
                    {!featureFlags ? (
                        <Loading />
                    ) : (
                        FEATURE_FLAGS.map((flag) => {
                            const requires = FEATURE_FLAG_REQUIRES[flag]
                            const blocked = requires !== undefined && !featureFlags[requires]
                            return (
                                <FlagCard
                                    key={flag}
                                    flag={flag}
                                    checked={featureFlags[flag]}
                                    label={f.labels[flag]}
                                    hint={blocked ? f.requiresLabel(f.labels[requires]) : f.hints[flag]}
                                    disabled={!canWrite || blocked}
                                    onToggle={handleToggle}
                                />
                            )
                        })
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default FeatureFlagsPanel
