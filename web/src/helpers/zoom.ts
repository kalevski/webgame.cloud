const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]

export const stepZoom = (current: number, direction: -1 | 1): number => {
    const index = ZOOM_STEPS.findIndex((step) => step >= current - 0.001)
    const next = (index < 0 ? ZOOM_STEPS.length - 1 : index) + direction
    return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, next))]
}
