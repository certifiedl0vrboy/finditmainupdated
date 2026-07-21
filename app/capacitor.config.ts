import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.findit.app',
  appName: 'FindIt',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
