import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: false
        },
        manifest: {
          name: 'Medical App',
          short_name: 'MedApp',
          description: 'Medication and Health Tracker',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1waWxsIj48cGF0aCBkPSJtMTAuNSAyMC41IDEwLTEwYTUuMTMgNS4xMyAwIDAgMC03LjI1LTcuMjVsLTEwIDEwYTQuOTMgNC45MyAwIDAgMC0xLjQ0IDIuNDkgNC45MyA0LjkzIDAgMCAwIDEuNDQgNC43NWMxIDEgMi4zOCAxLjQ5IDMuOCAxLjVoMWE1LjAxIDUuMDEgMCAwIDAgMi40NS0xLjVaIi8+PGxpbmUgeDE9IjEyIiB4Mj0iMTcuNSIgeTE9IjYiIHkyPSIxMS41Ii8+PC9zdmc+',
              sizes: '192x192',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
