/// <reference types="vite/client" />
/// <reference types="@toolcase/web-components/react" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string

    readonly VITE_GA_DEBUG?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
