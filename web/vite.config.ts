import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcDirs = [
    'components', 'configs', 'contexts', 'helpers', 'hooks',
    'layouts', 'modals', 'modules', 'pages', 'services',
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
        port: Number(process.env.WEB_PORT ?? 5001),
        proxy: {
            '/api': {
                target: `http://127.0.0.1:${process.env.API_PORT ?? process.env.PORT ?? 5000}`,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build',
        rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules')) return 'vendor' } } },
    },
})
