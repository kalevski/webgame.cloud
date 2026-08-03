import { useEffect, useRef } from 'react'
import { stepZoom } from 'helpers/zoom'

const isTypingTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    return (
        target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    )
}

export type EditorShortcutHandlers = {
    onSave: () => void
    onZoom: (next: (current: number) => number) => void
    onDeselect: () => void
    onDuplicate: () => void
    onDelete: () => void
    onNudge: (deltaX: number, deltaY: number) => void
    hasSelection: boolean
}

const useEditorShortcuts = (handlers: EditorShortcutHandlers) => {
    const latest = useRef(handlers)

    useEffect(() => {
        latest.current = handlers
    })

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const current = latest.current
            const command = event.metaKey || event.ctrlKey

            if (command && event.key.toLowerCase() === 's') {
                event.preventDefault()
                current.onSave()
                return
            }

            if (command && (event.key === '=' || event.key === '+')) {
                event.preventDefault()
                current.onZoom((zoom) => stepZoom(zoom, 1))
                return
            }

            if (command && event.key === '-') {
                event.preventDefault()
                current.onZoom((zoom) => stepZoom(zoom, -1))
                return
            }

            if (command && event.key === '0') {
                event.preventDefault()
                current.onZoom(() => 1)
                return
            }

            if (isTypingTarget(event.target)) return

            if (event.key === 'Escape') {
                current.onDeselect()
                return
            }

            if (!current.hasSelection) return

            if (command && event.key.toLowerCase() === 'd') {
                event.preventDefault()
                current.onDuplicate()
                return
            }

            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault()
                current.onDelete()
                return
            }

            const step = event.shiftKey ? 5 : 0.5
            const delta =
                event.key === 'ArrowLeft'
                    ? { x: -step, y: 0 }
                    : event.key === 'ArrowRight'
                      ? { x: step, y: 0 }
                      : event.key === 'ArrowUp'
                        ? { x: 0, y: -step }
                        : event.key === 'ArrowDown'
                          ? { x: 0, y: step }
                          : null
            if (!delta) return
            event.preventDefault()
            current.onNudge(delta.x, delta.y)
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return undefined
}

export default useEditorShortcuts
