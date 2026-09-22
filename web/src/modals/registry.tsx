import React, { FC, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePageContext } from 'contexts/PageContext'
import useSheetHistory from 'hooks/useSheetHistory'
import type { ModalKey } from './keys'

type ActiveModal = {
    key: ModalKey
    input?: unknown
    onClose?: (payload: unknown) => void
}

type ModalContextValue = {
    active: ActiveModal | null
    open: (modal: ActiveModal) => void
    close: (payload: unknown) => void
}

const ModalStateContext = createContext<ModalContextValue>({
    active: null,
    open: () => {},
    close: () => {},
})

export const ModalContext: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [active, setActive] = useState<ActiveModal | null>(null)
    const activeRef = useRef<ActiveModal | null>(null)
    useEffect(() => {
        activeRef.current = active
    }, [active])

    const open = useCallback((modal: ActiveModal) => setActive(modal), [])
    const close = useCallback((payload: unknown) => {
        const current = activeRef.current
        if (!current) return
        setActive(null)
        current.onClose?.(payload)
    }, [])

    const value = useMemo(() => ({ active, open, close }), [active, open, close])
    return <ModalStateContext.Provider value={value}>{children}</ModalStateContext.Provider>
}

export const useModalOpen = <TPayload, TInput = void>(
    key: ModalKey,
    onClose?: (payload: TPayload | null) => void
) => {
    const { open } = useContext(ModalStateContext)
    return useCallback(
        (input?: TInput) => open({ key, input, onClose: onClose as ((payload: unknown) => void) | undefined }),
        [open, key, onClose]
    )
}

export const useModalClose = () => {
    const { close } = useContext(ModalStateContext)
    return close
}

export const useModalIsOpen = (key: ModalKey): boolean => {
    const { active } = useContext(ModalStateContext)
    return active?.key === key
}

export const useModalInput = <T,>(key: ModalKey): T | undefined => {
    const { active } = useContext(ModalStateContext)
    return active?.key === key ? (active.input as T | undefined) : undefined
}

export type SheetPresentation = 'content' | 'full'

type SheetWindowProps = {
    modalKey: string
    title: string | ((input: unknown) => string)
    presentation?: SheetPresentation
    className?: string
    children: React.ReactNode
}

const SNAP: Record<SheetPresentation, string> = {
    content: 'auto',
    full: 'full',
}

export const SheetFooter: FC<{ children: React.ReactNode }> = ({ children }) => (
    <div slot="footer" className="app-sheet-footer">
        {children}
    </div>
)

export const SheetWindow: FC<SheetWindowProps> = ({ modalKey, title, presentation = 'content', className, children }) => {
    const { active, close } = useContext(ModalStateContext)
    const { chromeHosts } = usePageContext()
    const isOpen = active?.key === modalKey
    const [mounted, setMounted] = useState(isOpen)

    useEffect(() => {
        if (isOpen) {
            setMounted(true)
            return
        }
        const timer = window.setTimeout(() => setMounted(false), 320)
        return () => window.clearTimeout(timer)
    }, [isOpen])

    const onClose = useCallback(() => {
        if (active?.key === modalKey) close(null)
    }, [active, modalKey, close])

    useSheetHistory(isOpen, onClose)

    const host = chromeHosts.overlay ?? document.body

    const heading = typeof title === 'function' ? title(isOpen ? active?.input : undefined) : title

    return createPortal(
        <tc-bottom-sheet
            heading={heading}
            className={className}
            open={isOpen === true}
            snap={SNAP[presentation]}
            ontc-sheet-close={onClose}
        >
            {mounted ? children : <div className="app-sheet__placeholder" />}
        </tc-bottom-sheet>,
        host
    )
}
