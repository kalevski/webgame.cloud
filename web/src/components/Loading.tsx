import React from 'react'

const Loading: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div className="component-loading">
        <div className="component-loading__brand">{children}</div>
        <tc-spinner></tc-spinner>
    </div>
)

export default Loading
