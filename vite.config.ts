import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Inline assets smaller than 4KB as base64 data URLs
      assetsInlineLimit: 4096,
      // Enable minification with esbuild (fastest)
      minify: 'esbuild',
      // Skip source maps in production to reduce bundle size
      sourcemap: false,
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal long-term caching
          // Each chunk is cached independently — a code change only invalidates its chunk
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Core React runtime — rarely changes
              if (id.includes('/react/') || id.includes('/react-dom/')) {
                return 'react-vendor';
              }
              // Animation library
              if (id.includes('/motion/') || id.includes('/framer-motion/')) {
                return 'motion';
              }
              // Icons — large package, isolate for caching
              if (id.includes('/lucide-react/')) {
                return 'icons';
              }
              // Socket.IO client
              if (id.includes('/socket.io-client/') || id.includes('/socket.io/')) {
                return 'socket';
              }
              // Remaining node_modules in a shared vendor chunk
              return 'vendor';
            }
          },
        },
      },
      // Warn when chunk exceeds 600KB
      chunkSizeWarningLimit: 600,
    },
  };
});
