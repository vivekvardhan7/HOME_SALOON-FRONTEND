import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import os from "os";
import { componentTagger } from "lovable-tagger";
// import eslint from "vite-plugin-eslint";  // Temporarily disabled - use npm run lint instead

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use OS temp directory for cache to avoid OneDrive permission issues on Windows
  cacheDir: path.join(os.tmpdir(), 'vite-cache-homebonzenga'),
  server: {
    host: "::",
    port: 3003,
    strictPort: true,
    fs: {
      // Allow serving files from one level up to the project root
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
      },
    },
  },
  plugins: [
    react(),
    // 🚨 ESLint enforcement - Temporarily disabled in dev, use npm run lint
    // eslint({
    //   failOnError: true,
    //   failOnWarning: false,
    //   emitError: true,
    //   emitWarning: true,
    //   include: ['src/**/*.{ts,tsx}'],
    //   exclude: ['node_modules', 'dist'],
    // }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        jsx: "react-jsx",
        strict: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitAny: false,
        noFallthroughCasesInSwitch: false,
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"]
        }
      },
      include: ["src"]
    }
  }
}));
