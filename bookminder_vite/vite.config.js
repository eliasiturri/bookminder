import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'



// https://vitejs.dev/config/
export default defineConfig(() =>{

    const env = loadEnv('development', process.cwd());
    console.log('env', env);
    
    const HOST = env.VITE_HOST || '127.0.0.1';
    const PORT = env.VITE_PORT || 5173;
    const BASE = env.VITE_BASE || '/';
    const HMR_HOST = env.VITE_HMR_HOST || 'localhost';
    const HMR_PORT = env.VITE_HMR_PORT || 80;
    const HMR_PROTOCOL = env.VITE_HMR_PROTOCOL || 'ws';
    return {
        base: BASE,
        server: {
            host: HOST,
            port: PORT,
            hmr: {
                host: HMR_HOST,
                clientPort: HMR_PORT,
                protocol: HMR_PROTOCOL
            }
        },
        plugins: [
            vue({
                template: {
                    compilerOptions: {
                        // Treat foliate-view as a custom element so Vue doesn't try to resolve it as a component
                        isCustomElement: (tag) => ['foliate-view'].includes(tag)
                    }
                }
            }),
            VueDevTools(),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            }
        }
    }
})
