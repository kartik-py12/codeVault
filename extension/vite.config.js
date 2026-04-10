import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';

export default defineConfig({
    plugins: [
        react(),
        {
            name: "copy-manifest",
            closeBundle(){
                copyFileSync('manifest.json','dist/manifest.json');
                mkdirSync('dist/icons', {recursive:true});
                copyFileSync('icons/save.svg','dist/icons/save.svg');
                copyFileSync('icons/github.svg','dist/icons/github.svg');
            }
        }
    ],
    build:{
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions:{
            input: {
                content: resolve(__dirname, 'src/content/index.js'),
                background: resolve(__dirname, 'src/background/index.js'),
                popup: resolve(__dirname, 'src/popup/index.html'),
                injected: resolve(__dirname,'src/injected/index.js')
            },
            preserveEntrySignatures: 'strict',
            output: {
                entryFileNames: '[name].js',
            }
        }

    }
})