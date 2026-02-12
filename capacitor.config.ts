import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.njadi.ai',
  appName: 'NJADI AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Add plugin configurations here if needed
  }
};

export default config;