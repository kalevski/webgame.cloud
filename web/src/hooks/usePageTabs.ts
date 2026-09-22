import { useEffect } from 'react'
import { usePageContext, type PageTab } from 'contexts/PageContext'

const usePageTabs = (tabs: PageTab[]): void => {
    const { setPageTabs } = usePageContext()
    const key = JSON.stringify(tabs)

    useEffect(() => {
        setPageTabs(JSON.parse(key) as PageTab[])
        return () => setPageTabs([])
    }, [setPageTabs, key])
}

export default usePageTabs
