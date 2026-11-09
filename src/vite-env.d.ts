/// <reference types="vite/client" />

declare const __APP_BUILD_TIME__: string

interface ImportMetaEnv {
  readonly VITE_GITHUB_OWNER?: string
  readonly VITE_GITHUB_REPO?: string
  readonly VITE_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
