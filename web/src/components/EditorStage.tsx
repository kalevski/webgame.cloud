import React, { forwardRef, useEffect, useRef, useState } from 'react'

type EditorStageProps = React.ComponentPropsWithoutRef<'div'> & {
    width: number
    height: number
    zoom: number
    stageClassName?: string
    onFit?: (fit: number) => void
}

const EditorStage = forwardRef<HTMLDivElement, EditorStageProps>(
    ({ width, height, zoom, stageClassName, onFit, style, children, ...rest }, ref) => {
        const stageRef = useRef<HTMLDivElement>(null)
        const [fit, setFit] = useState(0)

        const report = useRef(onFit)

        useEffect(() => {
            report.current = onFit
        }, [onFit])

        useEffect(() => {
            const stage = stageRef.current
            if (!stage) return
            const observer = new ResizeObserver((entries) => {
                const box = entries[0]?.contentRect
                if (!box || box.width <= 0 || box.height <= 0) return
                const next = Math.min(box.width / width, box.height / height)
                setFit(next)
                report.current?.(next)
            })
            observer.observe(stage)
            return () => observer.disconnect()
        }, [width, height])

        const scale = fit * zoom

        return (
            <div ref={stageRef} className={stageClassName ?? 'ed-stage'}>
                {scale > 0 && (
                    <div
                        {...rest}
                        ref={ref}
                        style={{ ...style, width: `${width * scale}px`, height: `${height * scale}px` }}
                    >
                        {children}
                    </div>
                )}
            </div>
        )
    }
)

EditorStage.displayName = 'EditorStage'

export default EditorStage
