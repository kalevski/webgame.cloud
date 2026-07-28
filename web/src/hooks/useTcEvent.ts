import { RefObject, useEffect } from 'react'

export const useTcEvent = <T>(
    ref: RefObject<HTMLElement | null>,
    event: string,
    handler: (detail: T) => void
): void => {
    useEffect(() => {
        const element = ref.current
        if (!element) return
        const listener = (raw: Event) => handler((raw as CustomEvent<T>).detail)
        element.addEventListener(event, listener)
        return () => element.removeEventListener(event, listener)
    })
}

export default useTcEvent
