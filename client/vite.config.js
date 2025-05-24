import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    // Ensure proper handling of environment variables
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
  // Use relative paths for API calls
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://chat-app-clientt.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'https://chat-app-clientt.onrender.com',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  // Ensure environment variables are properly handled
  define: {
    'process.env': process.env
  },
  // Ensure proper path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
})
