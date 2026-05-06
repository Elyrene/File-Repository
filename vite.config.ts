import { defineConfig } from 'vite';

export default defineConfig({
  server:{
    proxy:{
      "^/api/.*":"http://localhost:3000",
    }
  },
  build: {
    // 打包输出到 dist 目录，server.js 会将此目录作为静态根目录
    outDir: 'dist',
    emptyOutDir: true, 
    // 入口文件
    rollupOptions: {
      input: 'index.html', // 将根目录的 index.html 作为入口
    }
  }
});