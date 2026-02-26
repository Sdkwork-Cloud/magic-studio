import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      outDir: 'dist',
      rollupTypes: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SdkworkReactMagiccut',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        '@sdkwork/react-commons',
        '@sdkwork/react-core',
        '@sdkwork/react-assets',
        '@sdkwork/react-image',
        '@sdkwork/react-video',
        '@sdkwork/react-audio',
        '@sdkwork/react-fs'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/react-commons': 'SdkworkReactCommons',
          '@sdkwork/react-core': 'SdkworkReactCore',
          '@sdkwork/react-assets': 'SdkworkReactAssets',
          '@sdkwork/react-image': 'SdkworkReactImage',
          '@sdkwork/react-video': 'SdkworkReactVideo',
          '@sdkwork/react-audio': 'SdkworkReactAudio',
          '@sdkwork/react-fs': 'SdkworkReactFs'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
