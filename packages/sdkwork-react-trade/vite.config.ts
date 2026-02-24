import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sdkwork-react-trade',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'lucide-react',
        'classnames',
        'zustand',
        'sdkwork-react-core',
        'sdkwork-react-commons',
        'sdkwork-react-auth',
        'sdkwork-react-workspace',
        'sdkwork-react-notifications',
        'sdkwork-react-vip',
        'sdkwork-react-i18n',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'lucide-react',
          classnames: 'classnames',
          zustand: 'zustand',
          'sdkwork-react-core': 'sdkwork-react-core',
          'sdkwork-react-commons': 'sdkwork-react-commons',
          'sdkwork-react-auth': 'sdkwork-react-auth',
          'sdkwork-react-workspace': 'sdkwork-react-workspace',
          'sdkwork-react-notifications': 'sdkwork-react-notifications',
          'sdkwork-react-vip': 'sdkwork-react-vip',
          'sdkwork-react-i18n': 'sdkwork-react-i18n',
        },
      },
    },
  },
});
