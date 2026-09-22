import React from 'react'

type ModuleActionsProps = {
    children: React.ReactNode
}

const ModuleActions: React.FC<ModuleActionsProps> = ({ children }) => (
    <tc-stack direction="horizontal" justify="flex-end" gap="0.5rem" className="module-actions">
        {children}
    </tc-stack>
)

export default ModuleActions
