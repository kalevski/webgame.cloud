import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const loadRootEnv = (): void => {
    const file = path.resolve(__dirname, '../.env')
    if (!fs.existsSync(file)) return
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const separator = trimmed.indexOf('=')
        if (separator < 0) continue
        const key = trimmed.slice(0, separator).trim()
        if (process.env[key] !== undefined) continue
        process.env[key] = trimmed.slice(separator + 1).trim()
    }
}

loadRootEnv()

const srcDirs = [
    'components', 'configs', 'contexts', 'helpers', 'hooks',
    'layouts', 'lib', 'modals', 'modules', 'pages', 'services',
    'state', 'styles', 'types',
]

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: srcDirs.map((dir) => ({
            find: new RegExp(`^${dir}(/|$)`),
            replacement: path.resolve(__dirname, `src/${dir}`) + '/',
        })),
    },
    css: { preprocessorOptions: { scss: {} } },
    server: {
        port: Number(process.env.WEB_PORT ?? 6001),
        proxy: {
            '/api': {
                target: `http://127.0.0.1:${process.env.API_PORT ?? process.env.PORT ?? 6000}`,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build',
        rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules')) return 'vendor' } } },
    },
})
