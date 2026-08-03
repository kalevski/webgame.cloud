export const baseName = (name: string): string => {
    const dot = name.lastIndexOf('.')
    return dot > 0 ? name.slice(0, dot) : name
}

export const slug = (name: string): string => name.toLowerCase().trim().replace(/\s+/g, '-')
