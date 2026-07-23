// vite.config.ts
import { defineConfig } from "file:///C:/Github/RFDGameStudio/ts/node_modules/vitest/dist/config.js";
import react from "file:///C:/Github/RFDGameStudio/ts/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Github/RFDGameStudio/ts/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  base: "/arcade/rfdgamestudio/",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"]
  },
  optimizeDeps: {
    include: ["fengari-web"],
    esbuildOptions: {
      define: { global: "globalThis" }
    }
  },
  server: {
    fs: {
      // Allow serving files from repo root (engine/, games/ directories)
      allow: [".."]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxHaXRodWJcXFxcUkZER2FtZVN0dWRpb1xcXFx0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcR2l0aHViXFxcXFJGREdhbWVTdHVkaW9cXFxcdHNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L0dpdGh1Yi9SRkRHYW1lU3R1ZGlvL3RzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogJy9hcmNhZGUvcmZkZ2FtZXN0dWRpby8nLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBwbHVnaW5zOiBbcmVhY3QoKSBhcyBhbnksIHRhaWx3aW5kY3NzKCkgYXMgYW55XSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgaW5jbHVkZTogWyd0ZXN0cy8qKi8qLnt0cyx0c3h9JywgJ3Rlc3RzLyoqLyoue3Rlc3Qsc3BlY30ue3RzLHRzeH0nXSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydmZW5nYXJpLXdlYiddLFxuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICBkZWZpbmU6IHsgZ2xvYmFsOiAnZ2xvYmFsVGhpcycgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBmczoge1xuICAgICAgLy8gQWxsb3cgc2VydmluZyBmaWxlcyBmcm9tIHJlcG8gcm9vdCAoZW5naW5lLywgZ2FtZXMvIGRpcmVjdG9yaWVzKVxuICAgICAgYWxsb3c6IFsnLi4nXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdRLFNBQVMsb0JBQW9CO0FBQ3JTLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUV4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUE7QUFBQSxFQUVOLFNBQVMsQ0FBQyxNQUFNLEdBQVUsWUFBWSxDQUFRO0FBQUEsRUFDOUMsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUyxDQUFDLHVCQUF1QixpQ0FBaUM7QUFBQSxFQUNwRTtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGFBQWE7QUFBQSxJQUN2QixnQkFBZ0I7QUFBQSxNQUNkLFFBQVEsRUFBRSxRQUFRLGFBQWE7QUFBQSxJQUNqQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLElBQUk7QUFBQTtBQUFBLE1BRUYsT0FBTyxDQUFDLElBQUk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
