import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
=======
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
>>>>>>> db7b5401af2fbeeeb8072e986cdf50145d0fb924
