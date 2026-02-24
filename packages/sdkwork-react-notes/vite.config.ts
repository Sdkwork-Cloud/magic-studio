import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sdkwork-react-notes',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'sdkwork-react-commons',
        'sdkwork-react-core',
        'sdkwork-react-fs',
        'sdkwork-react-editor',
        'sdkwork-react-image',
        'sdkwork-react-video',
        'sdkwork-react-assets',
        'sdkwork-react-chat',
        'sdkwork-react-settings',
        'sdkwork-react-auth'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'sdkwork-react-commons': 'SdkworkReactCommons',
          'sdkwork-react-core': 'SdkworkReactCore',
          'sdkwork-react-fs': 'SdkworkReactFs',
          'sdkwork-react-editor': 'SdkworkReactEditor',
          'sdkwork-react-image': 'SdkworkReactImage',
          'sdkwork-react-video': 'SdkworkReactVideo',
          'sdkwork-react-assets': 'SdkworkReactAssets',
          'sdkwork-react-chat': 'SdkworkReactChat',
          'sdkwork-react-settings': 'SdkworkReactSettings',
          'sdkwork-react-auth': 'SdkworkReactAuth'
        }
      }
    },
    sourcemap: true,
  },
});
