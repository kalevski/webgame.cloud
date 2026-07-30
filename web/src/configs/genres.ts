import { AppType } from 'types'

export type Genre = {
    key: string
    label: string
    description: string
    icon: string
    tags: readonly string[]
}

export const GAME_GENRES: readonly Genre[] = [
    {
        key: 'action',
        label: 'Action',
        description: 'Reflex-driven combat, shooters, hack and slash.',
        icon: 'swords',
        tags: ['combat', 'vfx', 'sfx'],
    },
    {
        key: 'platformer',
        label: 'Platformer',
        description: 'Jumping, running, tight level geometry.',
        icon: 'footprints',
        tags: ['tileset', 'character', 'parallax'],
    },
    {
        key: 'puzzle',
        label: 'Puzzle',
        description: 'Logic, matching, physics toys.',
        icon: 'puzzle',
        tags: ['ui', 'sfx', 'levels'],
    },
    {
        key: 'rpg',
        label: 'RPG',
        description: 'Stats, inventories, dialogue, long sessions.',
        icon: 'scroll-text',
        tags: ['portraits', 'items', 'dialogue'],
    },
    {
        key: 'strategy',
        label: 'Strategy',
        description: 'Turn-based or real-time tactics and management.',
        icon: 'crown',
        tags: ['units', 'ui', 'map'],
    },
    {
        key: 'racing',
        label: 'Racing',
        description: 'Vehicles, tracks, time trials.',
        icon: 'car-front',
        tags: ['vehicles', 'track', 'sfx'],
    },
    {
        key: 'sports',
        label: 'Sports',
        description: 'Ball games, arcade sports, management.',
        icon: 'trophy',
        tags: ['teams', 'ui', 'crowd'],
    },
    {
        key: 'arcade',
        label: 'Arcade',
        description: 'Short loops, high scores, instant restarts.',
        icon: 'joystick',
        tags: ['sprites', 'sfx', 'ui'],
    },
    {
        key: 'adventure',
        label: 'Adventure',
        description: 'Exploration, story beats, point and click.',
        icon: 'compass',
        tags: ['backgrounds', 'dialogue', 'music'],
    },
    {
        key: 'simulation',
        label: 'Simulation',
        description: 'Systems, building, tycoon and sandbox loops.',
        icon: 'factory',
        tags: ['ui', 'icons', 'ambience'],
    },
    {
        key: 'horror',
        label: 'Horror',
        description: 'Atmosphere, tension, scarce resources.',
        icon: 'ghost',
        tags: ['ambience', 'sfx', 'lighting'],
    },
    {
        key: 'casual',
        label: 'Casual',
        description: 'Pick-up-and-play, broad audience, short sessions.',
        icon: 'dice-5',
        tags: ['ui', 'sfx', 'icons'],
    },
]

export const APP_GENRES: readonly Genre[] = [
    {
        key: 'tool',
        label: 'Tool',
        description: 'A utility or generator that does one job well.',
        icon: 'wrench',
        tags: ['ui', 'icons', 'data'],
    },
    {
        key: 'editor',
        label: 'Editor',
        description: 'Create and edit content in the browser.',
        icon: 'pencil-ruler',
        tags: ['ui', 'icons', 'fonts'],
    },
    {
        key: 'viewer',
        label: 'Viewer',
        description: 'Inspect models, maps or media.',
        icon: 'eye',
        tags: ['ui', 'media', 'icons'],
    },
    {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Charts, metrics and live status.',
        icon: 'layout-dashboard',
        tags: ['ui', 'icons', 'data'],
    },
    {
        key: 'showcase',
        label: 'Showcase',
        description: 'A demo or marketing surface for a product.',
        icon: 'sparkles',
        tags: ['media', 'fonts', 'ui'],
    },
    {
        key: 'portfolio',
        label: 'Portfolio',
        description: 'Personal or studio work on display.',
        icon: 'gallery-vertical-end',
        tags: ['media', 'fonts', 'ui'],
    },
    {
        key: 'companion',
        label: 'Companion',
        description: 'A second screen for a game or a service.',
        icon: 'smartphone',
        tags: ['ui', 'icons', 'data'],
    },
    {
        key: 'docs',
        label: 'Documentation',
        description: 'Guides, references and API docs.',
        icon: 'book-open',
        tags: ['fonts', 'ui', 'data'],
    },
]

const PROTOTYPE_ONLY: readonly Genre[] = [
    {
        key: 'sandbox',
        label: 'Sandbox',
        description: 'A playground for trying one idea out.',
        icon: 'flask-conical',
        tags: ['scratch', 'wip'],
    },
    {
        key: 'mechanic-test',
        label: 'Mechanic test',
        description: 'One mechanic, isolated so you can feel it.',
        icon: 'gauge',
        tags: ['wip', 'test'],
    },
]

const OTHER_GENRE: Genre = {
    key: 'other',
    label: 'Other',
    description: 'Something else — pick this and tag it your own way.',
    icon: '',
    tags: [],
}

const pick = (source: readonly Genre[], keys: readonly string[]): Genre[] =>
    keys.map((key) => source.find((genre) => genre.key === key)).filter((genre): genre is Genre => !!genre)

export const PROTOTYPE_GENRES: readonly Genre[] = [
    ...pick(GAME_GENRES, ['action', 'puzzle', 'arcade']),
    ...pick(APP_GENRES, ['tool', 'viewer', 'showcase']),
    ...PROTOTYPE_ONLY,
]

export const GENRES_BY_APP_TYPE: Record<AppType, readonly Genre[]> = {
    game: [...GAME_GENRES, OTHER_GENRE],
    app: [...APP_GENRES, OTHER_GENRE],
    prototype: [...PROTOTYPE_GENRES, OTHER_GENRE],
}

export const genresFor = (appType: AppType): readonly Genre[] => GENRES_BY_APP_TYPE[appType]

export const GENRE_BY_KEY: Record<string, Genre> = Object.fromEntries(
    [...GAME_GENRES, ...APP_GENRES, ...PROTOTYPE_ONLY, OTHER_GENRE].map((genre) => [genre.key, genre])
)

export const PROJECT_ICONS: readonly { value: string; label: string }[] = [
    { value: 'gamepad-2', label: 'Gamepad' },
    { value: 'joystick', label: 'Joystick' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'swords', label: 'Swords' },
    { value: 'ghost', label: 'Ghost' },
    { value: 'dice-5', label: 'Dice' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'crown', label: 'Crown' },
    { value: 'trophy', label: 'Trophy' },
    { value: 'compass', label: 'Compass' },
    { value: 'car-front', label: 'Car' },
    { value: 'scroll-text', label: 'Scroll' },
    { value: 'footprints', label: 'Footprints' },
    { value: 'factory', label: 'Factory' },
    { value: 'sparkles', label: 'Sparkles' },
    { value: 'flame', label: 'Flame' },
]

export const PROJECT_COLORS: readonly string[] = [
    '#7c3aed',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#3b82f6',
    '#ef4444',
    '#8b5cf6',
]

export const DEFAULT_PROJECT_ICON = 'gamepad-2'

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0]
