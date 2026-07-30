import React, { useCallback, useEffect, useRef, useState } from 'react'

type FloatingActionBarProps = {
    label?: React.ReactNode
    visible?: boolean
    children?: React.ReactNode
}

type Box = { left: number; width: number }

const CLEARANCE = 32

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({ label, visible = true, children }) => {
    const anchor = useRef<HTMLDivElement>(null)
    const bar = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState<Box | null>(null)
    const [height, setHeight] = useState(0)

    const actions = React.Children.toArray(children).filter(Boolean)
    const shown = visible && actions.length > 0

    const measure = useCallback(() => {
        if (anchor.current) {
            const rect = anchor.current.getBoundingClientRect()
            setBox({ left: Math.round(rect.left), width: Math.round(rect.width) })
        }
        if (bar.current) setHeight(Math.ceil(bar.current.getBoundingClientRect().height))
    }, [])

    useEffect(() => {
        measure()
        const observer = new ResizeObserver(measure)
        if (anchor.current) observer.observe(anchor.current)
        if (bar.current) observer.observe(bar.current)
        window.addEventListener('resize', measure)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [measure, shown])

    useEffect(() => {
        const root = document.documentElement
        if (shown && height > 0) root.style.setProperty('--fab-clearance', `${height + CLEARANCE}px`)
        else root.style.removeProperty('--fab-clearance')
        return () => {
            root.style.removeProperty('--fab-clearance')
        }
    }, [shown, height])

    return (
        <div ref={anchor} className="floating-action-bar__anchor" aria-hidden={!shown || undefined}>
            <div
                ref={bar}
                className="floating-action-bar"
                data-visible={shown ? 'true' : 'false'}
                style={box ? { left: box.left, width: box.width } : undefined}
            >
                <div className="floating-action-bar__label">{label}</div>
                <div className="floating-action-bar__actions">{actions}</div>
            </div>
        </div>
    )
}

export default FloatingActionBar
