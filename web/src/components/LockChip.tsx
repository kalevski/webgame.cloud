import React from 'react'

type LockChipProps = {
    roleName: string | null
}

const LockChip: React.FC<LockChipProps> = ({ roleName }) => {
    if (!roleName) return null

    return <tc-badge variant="warning" text={`🔒 ${roleName}`}></tc-badge>
}

export default LockChip
