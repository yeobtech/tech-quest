import { defineConfig } from 'vite';
export default defineConfig({
  // Avoid restarting the dev page to optimize Three.js on the first NPC visit.
  build:{rollupOptions:{input:{game:'index.html',lab:'lab/index.html'}}},
  optimizeDeps:{include:['three','three/addons/controls/OrbitControls.js']}
});
