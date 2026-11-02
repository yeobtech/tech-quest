import { defineConfig } from 'vite';
export default defineConfig({
  // Avoid restarting the dev page to optimize Three.js on the first NPC visit.
  optimizeDeps:{include:['three','three/addons/controls/OrbitControls.js']}
});
