import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@excalidrow/shared/schemas': path.resolve(
        __dirname,
        '../../packages/shared/src/schemas/index.js',
      ),
      '@excalidrow/shared/constants': path.resolve(
        __dirname,
        '../../packages/shared/src/constants/index.js',
      ),
      '@excalidrow/shared/utils': path.resolve(
        __dirname,
        '../../packages/shared/src/utils/index.js',
      ),
      '@excalidrow/shared': path.resolve(__dirname, '../../packages/shared/src/index.js'),
    },
  },
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_SOCKET_URL ?? 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'excalidraw': ['@excalidraw/excalidraw'],
          'yjs': ['yjs'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
});
