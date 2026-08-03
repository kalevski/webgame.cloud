import { DesignTransition } from 'types'

const svgToImage = async (svg: SVGSVGElement): Promise<HTMLImageElement> => {
    const xml = new XMLSerializer().serializeToString(svg)
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    try {
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('svg render failed'))
            image.src = url
        })
        await image.decode().catch(() => {})
    } finally {
        URL.revokeObjectURL(url)
    }
    return image
}

export const svgToPngBlob = async (svg: SVGSVGElement, width: number, height: number): Promise<Blob> => {
    const image = await svgToImage(svg)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas 2d context unavailable')
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('png encoding failed')
    return blob
}

const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export const downloadSvgAsPng = async (
    svg: SVGSVGElement,
    width: number,
    height: number,
    filename: string
): Promise<void> => {
    downloadBlob(await svgToPngBlob(svg, width, height), `${filename}.png`)
}

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2)

const drawTransition = (
    context: CanvasRenderingContext2D,
    from: HTMLImageElement,
    to: HTMLImageElement,
    progress: number,
    width: number,
    height: number,
    transition: DesignTransition
): void => {
    const eased = easeInOut(Math.min(1, Math.max(0, progress)))
    switch (transition) {
        case 'slide':
            context.drawImage(from, -eased * width, 0, width, height)
            context.drawImage(to, width - eased * width, 0, width, height)
            break
        case 'slideUp':
            context.drawImage(from, 0, -eased * height, width, height)
            context.drawImage(to, 0, height - eased * height, width, height)
            break
        case 'wipe':
            context.drawImage(from, 0, 0, width, height)
            context.save()
            context.beginPath()
            context.rect(0, 0, eased * width, height)
            context.clip()
            context.drawImage(to, 0, 0, width, height)
            context.restore()
            break
        case 'zoom': {
            context.drawImage(from, 0, 0, width, height)
            const scale = 1.15 - 0.15 * eased
            const scaledWidth = width * scale
            const scaledHeight = height * scale
            context.globalAlpha = eased
            context.drawImage(to, (width - scaledWidth) / 2, (height - scaledHeight) / 2, scaledWidth, scaledHeight)
            context.globalAlpha = 1
            break
        }
        case 'iris': {
            context.drawImage(from, 0, 0, width, height)
            const radius = (eased * Math.hypot(width, height)) / 2
            context.save()
            context.beginPath()
            context.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
            context.clip()
            context.drawImage(to, 0, 0, width, height)
            context.restore()
            break
        }
        case 'blinds': {
            context.drawImage(from, 0, 0, width, height)
            const bands = 9
            const bandHeight = height / bands
            context.save()
            context.beginPath()
            for (let band = 0; band < bands; band += 1) {
                context.rect(0, band * bandHeight, width, eased * bandHeight)
            }
            context.clip()
            context.drawImage(to, 0, 0, width, height)
            context.restore()
            break
        }
        case 'flip': {
            const squeeze = Math.abs(1 - 2 * eased)
            const card = eased < 0.5 ? from : to
            const scaledWidth = width * squeeze
            context.drawImage(from, 0, 0, width, height)
            context.fillStyle = '#000000'
            context.globalAlpha = (1 - squeeze) * 0.55
            context.fillRect(0, 0, width, height)
            context.globalAlpha = 1
            context.drawImage(card, (width - scaledWidth) / 2, 0, scaledWidth, height)
            break
        }
        default:
            context.drawImage(from, 0, 0, width, height)
            context.globalAlpha = eased
            context.drawImage(to, 0, 0, width, height)
            context.globalAlpha = 1
    }
}

export class DesignRecordingStalled extends Error {
    constructor() {
        super('recording stalled')
        this.name = 'DesignRecordingStalled'
    }
}

const STALL_TIMEOUT_MS = 4_000

const nextFrame = (): Promise<void> =>
    new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new DesignRecordingStalled()), STALL_TIMEOUT_MS)
        requestAnimationFrame(() => {
            window.clearTimeout(timer)
            resolve()
        })
    })

export const recordFramesToVideo = async (
    svgs: SVGSVGElement[],
    width: number,
    height: number,
    durationsMs: number[],
    transitions: DesignTransition[]
): Promise<{ blob: Blob; extension: string }> => {
    if (document.visibilityState !== 'visible') throw new DesignRecordingStalled()

    const images = await Promise.all(svgs.map((svg) => svgToImage(svg)))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas 2d context unavailable')

    const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(
        (candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)
    )
    if (!mimeType) throw new Error('video recording unsupported')

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
    }
    const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
    })

    const transitionAt = (index: number): DesignTransition => transitions[index] ?? 'fade'
    const fadeFor = (index: number, holdMs: number) =>
        transitionAt(index) === 'cut' ? 0 : Math.min(600, holdMs / 3)

    const starts: number[] = []
    let totalMs = 0
    for (const holdMs of durationsMs) {
        starts.push(totalMs)
        totalMs += holdMs
    }

    for (const image of images) context.drawImage(image, 0, 0, width, height)
    context.drawImage(images[0], 0, 0, width, height)
    await nextFrame()
    await nextFrame()

    recorder.start()
    const start = performance.now()
    let lastFrameAt = performance.now()

    const timeline = new Promise<void>((resolve, reject) => {
        const watchdog = window.setInterval(() => {
            if (performance.now() - lastFrameAt > STALL_TIMEOUT_MS) {
                window.clearInterval(watchdog)
                reject(new DesignRecordingStalled())
            }
        }, 1_000)
        const frame = (now: number) => {
            lastFrameAt = now
            const elapsed = now - start
            if (elapsed >= totalMs) {
                window.clearInterval(watchdog)
                resolve()
                return
            }
            let index = images.length - 1
            for (let i = 0; i < images.length; i += 1) {
                if (elapsed < starts[i] + durationsMs[i]) {
                    index = i
                    break
                }
            }
            const holdMs = durationsMs[index]
            const within = elapsed - starts[index]
            const fadeMs = fadeFor(index, holdMs)
            context.globalAlpha = 1
            if (index < images.length - 1 && fadeMs > 0 && within > holdMs - fadeMs) {
                drawTransition(
                    context,
                    images[index],
                    images[index + 1],
                    (within - (holdMs - fadeMs)) / fadeMs,
                    width,
                    height,
                    transitionAt(index)
                )
            } else {
                context.drawImage(images[index], 0, 0, width, height)
            }
            requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
    })

    try {
        await timeline
    } finally {
        recorder.stop()
        stream.getTracks().forEach((track) => track.stop())
        await stopped
    }

    const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
    return { blob: new Blob(chunks, { type: mimeType }), extension }
}

export const downloadFramesAsVideo = async (
    svgs: SVGSVGElement[],
    width: number,
    height: number,
    durationsMs: number[],
    transitions: DesignTransition[],
    filename: string
): Promise<string> => {
    const { blob, extension } = await recordFramesToVideo(svgs, width, height, durationsMs, transitions)
    downloadBlob(blob, `${filename}.${extension}`)
    return extension
}

export const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('file read failed'))
        reader.readAsDataURL(file)
    })
