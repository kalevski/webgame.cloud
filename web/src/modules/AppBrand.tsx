import React from 'react'

const AppBrand: React.FC<{ xlarge?: boolean }> = ({ xlarge }) => (
    <tc-brand
        primary-text="WEBGAME"
        secondary-text=".CLOUD"
        color="#7c3aed"
        xlarge={xlarge || undefined}
    ></tc-brand>
)

export default AppBrand
