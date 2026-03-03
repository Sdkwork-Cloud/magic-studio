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
      name: '@sdkwork/react-drive',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@sdkwork/react-assets',
        '@sdkwork/react-commons',
        '@sdkwork/react-core',
        '@sdkwork/react-fs',
        '@sdkwork/react-settings',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/react-assets': 'SdkworkReactAssets',
          '@sdkwork/react-commons': 'SdkworkReactCommons',
          '@sdkwork/react-core': 'SdkworkReactCore',
          '@sdkwork/react-fs': 'SdkworkReactFs',
          '@sdkwork/react-settings': 'SdkworkReactSettings',
          '@aws-sdk/client-s3': 'AWSS3',
          '@aws-sdk/s3-request-presigner': 'AWSS3Presigner'
        }
      }
    },
    sourcemap: true,
  },
});

