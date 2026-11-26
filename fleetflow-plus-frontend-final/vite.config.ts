import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); const target = env.BACKEND_PROXY_URL || 'http://localhost:6050'; return { plugins: [react()], server: { port: 5173, strictPort: true, proxy: Object.fromEntries(['/auth', '/notifications', '/contact'].map(path => [path, { target, changeOrigin: true }])) }, build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules')) {
                    if (/node_modules\/(react|react-dom|scheduler)\//.test(id))
                        return 'react-core';
                    if (id.includes('/leaflet/') || id.includes('/react-leaflet/'))
                        return 'maps';
                } } } } } }; });
