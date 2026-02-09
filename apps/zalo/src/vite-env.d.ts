/// <reference types="vite/client" />

type ViteEnvString = string | undefined;

interface ImportMetaEnv {
  readonly VITE_ZALO_APP_ID: ViteEnvString;
  readonly VITE_ZALO_OA_ID: ViteEnvString;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
