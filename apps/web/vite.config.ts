import path from "path"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler', '@supabase/supabase-js'],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@stepsense/core": path.resolve(import.meta.dirname, "../../packages/core/index.ts"),
      "@stepsense/types": path.resolve(import.meta.dirname, "../../packages/types/index.ts"),
      "@stepsense/supabase-client": path.resolve(import.meta.dirname, "../../packages/supabase-client/index.ts"),
      "@stepsense/design-tokens": path.resolve(import.meta.dirname, "../../packages/design-tokens/index.ts"),
    },
  },
})
