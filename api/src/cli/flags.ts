export type ParsedArgs = {
    options: Record<string, string>
    positional: string[]
}

export const parseArgs = (argv: string[]): ParsedArgs => {
    const options: Record<string, string> = {}
    const positional: string[] = []

    for (const argument of argv) {
        if (!argument.startsWith('--')) {
            positional.push(argument)
            continue
        }
        const separator = argument.indexOf('=')
        const key = argument.slice(2, separator === -1 ? undefined : separator)
        options[key] = separator === -1 ? 'true' : argument.slice(separator + 1)
    }

    return { options, positional }
}
