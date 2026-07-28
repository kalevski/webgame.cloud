import React, { FC, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTc } from '@toolcase/web-components/react'

type ActiveModal = {
    key: string
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
    key: string,
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

export const useModalIsOpen = (key: string): boolean => {
    const { active } = useContext(ModalStateContext)
    return active?.key === key
}

export const useModalInput = <T,>(key: string): T | undefined => {
    const { active } = useContext(ModalStateContext)
    return active?.key === key ? (active.input as T | undefined) : undefined
}

type ModalWindowProps = {
    modalKey: string
    title: string | ((input: unknown) => string)
    size?: 'sm' | 'lg' | 'xl'
    staticBackdrop?: boolean
    children: React.ReactNode
}

export const ModalWindow: FC<ModalWindowProps> = ({ modalKey, title, size, staticBackdrop, children }) => {
    const { active, close } = useContext(ModalStateContext)
    const isOpen = active?.key === modalKey
    const isOpenRef = useRef(isOpen)
    const openerRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (isOpen && !isOpenRef.current) {
            const opener = document.activeElement
            openerRef.current = opener instanceof HTMLElement ? opener : null
        }
        if (!isOpen && isOpenRef.current) {
            const opener = openerRef.current
            openerRef.current = null
            if (opener?.isConnected) opener.focus()
            else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        }
        isOpenRef.current = isOpen
    }, [isOpen])

    const modal = useTc<HTMLElement>(
        { open: isOpen },
        {
            'tc-hidden': () => {
                if (isOpenRef.current) close(null)
            },
        }
    )

    useEffect(() => {
        if (!isOpen) return
        const onKeydown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            if (!modal.current?.querySelector('.tc-extended-select__menu--open, .tc-tag-input-menu--open')) return
            event.stopPropagation()
            document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        }
        document.addEventListener('keydown', onKeydown, true)
        return () => document.removeEventListener('keydown', onKeydown, true)
    }, [isOpen, modal])

    const resolvedTitle = typeof title === 'function' ? title(isOpen ? active?.input : undefined) : title

    return (
        <tc-modal
            ref={modal}
            title={resolvedTitle}
            size={size}
            static-backdrop={staticBackdrop || undefined}
            centered
            lazy
        >
            {children}
        </tc-modal>
    )
}
