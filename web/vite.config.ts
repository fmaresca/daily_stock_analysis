import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';
import path from 'path';

let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  commitHash = process.env.CF_PAGES_COMMIT_SHA?.substring(0, 7) || 'prod';
}
const buildTimestamp = new Date().toISOString();
const buildId = `dh-${commitHash}-${buildTimestamp.replace(/[-:T.]/g, '').substring(0, 14)}`;

const appVersion = 'v3.4';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
    __APP_COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lightweight-charts')) {
              return 'vendor-charts';
            }
          }
          if (id.includes('securityIntelligenceRegistry')) {
            return 'data-security-registry';
          }
          if (id.includes('macroScheduleData')) {
            return 'data-macro-schedule';
          }
          if (id.includes('cboeWeeklyDirectory')) {
            return 'data-cboe-weekly';
          }
          if (id.includes('components/icons') || id.includes('components\\icons')) {
            return 'ui-icons';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
});
