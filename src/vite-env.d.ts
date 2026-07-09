/// <reference types="vite/client" />

// Build stamp injected by vite.config (git short SHA + start time).
declare const __APP_BUILD__: string;

declare module "*.md?raw" {
  const content: string;
  export default content;
}
