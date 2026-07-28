import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'

type Props = {
    projectId: string
}

const ProjectLockBanner: React.FC<Props> = ({ projectId }) => {
    const { t } = useStrings()
    const lock = useStore((state) => state.lock)
    const pollLock = useStore((state) => state.pollLock)
    const stopLockPoll = useStore((state) => state.stopLockPoll)

    useEffect(() => {
        pollLock(projectId)
        return () => stopLockPoll()
    }, [projectId, pollLock, stopLockPoll])

    if (!lock?.locked) return null

    return <tc-banner variant="warning" icon="lock">{t.projects.lockedBanner}</tc-banner>
}

export default ProjectLockBanner
