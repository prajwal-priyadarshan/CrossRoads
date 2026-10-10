import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: Number(env.VITE_DEV_PORT ?? 5173),
      // The web app always calls /api; in dev Vite forwards it to the API (production uses a Vercel rewrite)
      proxy: { '/api': { target: env.API_PROXY_TARGET ?? 'http://localhost:4000', changeOrigin: true } },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep large vendor libraries in their own long-cached chunks
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react';
            if (id.includes('@tanstack')) return 'query';
            if (id.includes('@radix-ui') || id.includes('radix-ui')) return 'radix';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            return undefined;
          },
        },
      },
    },
  };
});
