import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

export async function resolve(specifier, context, next) {
    if (specifier.endsWith('.module.js') && context.parentURL?.includes('/@toolcase/')) {
        return { url: new URL(specifier, context.parentURL).href, format: 'module', shortCircuit: true }
    }
    if (specifier.startsWith('@toolcase/')) {
        const cjsPath = require.resolve(specifier)
        const esmPath = cjsPath.replace(/\.main\.js$/, '.module.js')
        if (esmPath !== cjsPath && existsSync(esmPath)) {
            return { url: pathToFileURL(esmPath).href, format: 'module', shortCircuit: true }
        }
        return next(specifier, context)
    }
    if (!specifier.endsWith('.sql')) return next(specifier, context)
    return { url: new URL(specifier, context.parentURL).href, format: 'module', shortCircuit: true }
}

export async function load(url, context, next) {
    if (!url.endsWith('.sql')) return next(url, context)
    const text = await readFile(fileURLToPath(url), 'utf8')
    return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(text)}` }
}
