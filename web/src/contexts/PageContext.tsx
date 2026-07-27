import React, { createContext, FC, useContext, useMemo, useState } from 'react'

const PageContext = createContext({
    pageTitle: '',
    pageDescription: '',
    color: '#000000',
    setPageTitle: (_: string) => {},
    setPageDescription: (_: string) => {},
    setColor: (_: string) => {},
})

export const PageProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState('AppKit')
    const [pageDescription, setPageDescription] = useState('')
    const [color, setColor] = useState('#000000')

    const value = useMemo(
        () => ({ pageTitle, pageDescription, color, setPageTitle, setPageDescription, setColor }),
        [pageTitle, pageDescription, color]
    )

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

export const usePageContext = () => useContext(PageContext)
