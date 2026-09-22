import { createRoot } from 'react-dom/client'
import { register } from '@toolcase/web-components'
import '@toolcase/web-components/style.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/400-italic.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/700.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import './styles/app.scss'
import { Router } from './Router'
import applyToolcaseMessages from './configs/toolcaseMessages'
import { initAnalytics } from './helpers/analytics'
import { captureGlobalErrors } from './helpers/observability'

register()
applyToolcaseMessages()
initAnalytics()
captureGlobalErrors()

document.addEventListener('click', (event) => {
    const combo = (event.target as Element | null)?.closest?.('tc-combo-box')
    combo?.querySelector<HTMLInputElement>('.tc-combo-box__search-input')?.focus()
})

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    })
}

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing in index.html')
createRoot(container).render(<Router />)
