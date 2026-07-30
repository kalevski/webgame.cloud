import carFront from 'lucide-static/icons/car-front.svg?raw'
import compass from 'lucide-static/icons/compass.svg?raw'
import crown from 'lucide-static/icons/crown.svg?raw'
import dice5 from 'lucide-static/icons/dice-5.svg?raw'
import factory from 'lucide-static/icons/factory.svg?raw'
import flame from 'lucide-static/icons/flame.svg?raw'
import footprints from 'lucide-static/icons/footprints.svg?raw'
import gamepad2 from 'lucide-static/icons/gamepad-2.svg?raw'
import ghost from 'lucide-static/icons/ghost.svg?raw'
import joystick from 'lucide-static/icons/joystick.svg?raw'
import puzzle from 'lucide-static/icons/puzzle.svg?raw'
import rocket from 'lucide-static/icons/rocket.svg?raw'
import scrollText from 'lucide-static/icons/scroll-text.svg?raw'
import sparkles from 'lucide-static/icons/sparkles.svg?raw'
import swords from 'lucide-static/icons/swords.svg?raw'
import trophy from 'lucide-static/icons/trophy.svg?raw'

const SOURCES: Record<string, string> = {
    'car-front': carFront,
    compass,
    crown,
    'dice-5': dice5,
    factory,
    flame,
    footprints,
    'gamepad-2': gamepad2,
    ghost,
    joystick,
    puzzle,
    rocket,
    'scroll-text': scrollText,
    sparkles,
    swords,
    trophy,
}

const toKebab = (value: string): string =>
    value
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([a-zA-Z])(\d)/g, '$1-$2')
        .toLowerCase()

const cache = new Map<string, string>()

export const iconMaskUrl = (name: string): string => {
    const key = toKebab(name)
    const cached = cache.get(key)
    if (cached) return cached

    const source = SOURCES[key] ?? SOURCES['gamepad-2']
    const svg = source.replace(/<!--[\s\S]*?-->/g, '').trim()
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    cache.set(key, url)
    return url
}
