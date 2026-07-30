const ADJECTIVES = [
    'Neon', 'Crimson', 'Silent', 'Hollow', 'Molten', 'Frozen', 'Feral', 'Gilded',
    'Drifting', 'Fractured', 'Endless', 'Velvet', 'Iron', 'Lunar', 'Savage', 'Quiet',
    'Radiant', 'Static', 'Wandering', 'Obsidian',
]

const NOUNS = [
    'Drift', 'Bastion', 'Circuit', 'Harbour', 'Requiem', 'Orbit', 'Thicket', 'Signal',
    'Cascade', 'Vanguard', 'Marrow', 'Foundry', 'Lantern', 'Tempest', 'Relay', 'Garden',
    'Machine', 'Horizon', 'Anthem', 'Spire',
]

const pick = (words: readonly string[]): string => words[Math.floor(Math.random() * words.length)]

export const randomProjectName = (): string => `${pick(ADJECTIVES)} ${pick(NOUNS)}`
