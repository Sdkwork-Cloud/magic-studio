import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SdkworkReactCommons',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        'lucide-react',
        '@sdkwork/react-core',
        '@sdkwork/react-i18n',
        /^@sdkwork\/react-/
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'lucide-react': 'LucideReact',
          '@sdkwork/react-core': 'SdkworkReactCore',
          '@sdkwork/react-i18n': 'SdkworkReactI18n'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
