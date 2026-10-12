import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signlanguage.app',
  appName: '手语即时通',
  // Vite 构建产物目录
  webDir: 'dist',
  // 安卓用 https scheme，避免 file:// 下摄像头 / 定位等能力受限
  server: {
    androidScheme: 'https',
  },
  // PWA 的图标等资产如需在原生里复用，可在此补充
  plugins: {},
};

export default config;
