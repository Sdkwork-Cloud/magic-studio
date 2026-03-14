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
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sdkwork-react-film',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@sdkwork/react-assets',
        '@sdkwork/react-chat',
        '@sdkwork/react-commons',
        '@sdkwork/react-core',
        '@sdkwork/react-image',
        '@sdkwork/react-notes',
        '@sdkwork/react-settings',
        '@sdkwork/react-types',
        '@sdkwork/react-video',
        '@sdkwork/react-voicespeaker',
        '@sdkwork/react-workspace'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/react-assets': 'SdkworkReactAssets',
          '@sdkwork/react-chat': 'SdkworkReactChat',
          '@sdkwork/react-commons': 'SdkworkReactCommons',
          '@sdkwork/react-core': 'SdkworkReactCore',
          '@sdkwork/react-image': 'SdkworkReactImage',
          '@sdkwork/react-notes': 'SdkworkReactNotes',
          '@sdkwork/react-settings': 'SdkworkReactSettings',
          '@sdkwork/react-types': 'SdkworkReactTypes',
          '@sdkwork/react-video': 'SdkworkReactVideo',
          '@sdkwork/react-voicespeaker': 'SdkworkReactVoiceSpeaker',
          '@sdkwork/react-workspace': 'SdkworkReactWorkspace'
        }
      }
    },
    sourcemap: true,
  },
});

