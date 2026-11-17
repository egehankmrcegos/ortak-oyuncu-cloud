import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const resolve=(path:string)=>fileURLToPath(new URL(path,import.meta.url));
export default defineConfig({root:resolve('./'),base:'./',plugins:[react(),tailwindcss()],resolve:{alias:[
  {find:'@/lib/game.functions',replacement:resolve('./transport.ts')},
  {find:'@/lib/game-safety.functions',replacement:resolve('./transport.ts')},
  {find:'@/lib/training.functions',replacement:resolve('./training-transport.ts')},
  {find:'@tanstack/react-start',replacement:resolve('./start-shim.ts')},
  {find:'@',replacement:resolve('../src')}
]},build:{outDir:resolve('./www'),emptyOutDir:true},server:{host:'0.0.0.0',port:4174}});