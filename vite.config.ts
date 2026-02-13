import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This is crucial for Capacitor/Android to find assets
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
