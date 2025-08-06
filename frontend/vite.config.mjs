import { defineConfig, loadEnv } from 'vite';
import plugins from './src/plugins';
import path from 'path';
import fs from 'fs';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: true,
      port: 8088,
      proxy: {
        '/api': {
          target: env.VITE_PROD_TEST ? 'https://test-store.mobazha.org' : 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/v1': {
          target: env.VITE_PROD_TEST ? 'https://test-store.mobazha.org' : 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/info': {
          target: 'https://mobazha.info',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/info/, '')
        },
      },
    },
    // 基础配置
    base: './',
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        buffer: 'buffer',
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            '@border-color-base': '#dce3e8',
          },
          javascriptEnabled: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      brotliSize: false,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          // 生产环境去除console及debug
          drop_console: false,
          drop_debugger: true,
        },
      },
    },
    // for web
    define: {
      global: 'globalThis',
      'process.env': {
        TESTNET: JSON.stringify(process.env.TESTNET || 'false'),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      },
    },
    plugins: [
      ...plugins,
      tailwindcss(),
      // Element Plus 自动导入
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: true,
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: true,
      }),
      {
        name: 'handle-backbone-templates',
        enforce: 'pre',
        configureServer(server) {
          // 添加自定义中间件来处理模板文件
          server.middlewares.use((req, res, next) => {
            if (req.url?.includes('/backbone/templates/')) {
              const filePath = path.join(__dirname, req.url);
              try {
                const content = fs.readFileSync(filePath, 'utf-8');
                res.setHeader('Content-Type', 'text/plain');
                res.end(content);
              } catch (err) {
                next(err);
              }
              return;
            }
            next();
          });
        },
      },
      copyFoldersPlugin()
    ],
    esbuild: {
      target: 'es2015',
      supported: {
        'top-level-await': true
      }
    },
    optimizeDeps: {
      include: ['buffer', 'element-plus', 'process'],
    },
  };
});

// 添加复制文件夹的插件
function copyFoldersPlugin() {
  return {
    name: 'copy-folders',
    closeBundle() {
      const folders = [
        'backbone/languages',
        'backbone/templates',
        'imgs'
      ];
      
      folders.forEach(folder => {
        const srcDir = path.resolve(__dirname, folder);
        const destDir = path.resolve(__dirname, 'dist', folder);
        
        // 确保目标目录存在
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // 复制文件夹内容
        copyFolderRecursiveSync(srcDir, path.resolve(__dirname, 'dist'));
      });
    }
  };
}

// 递归复制文件夹的辅助函数
function copyFolderRecursiveSync(source, target) {
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, path.relative(__dirname, sourcePath));
    
    if (fs.statSync(sourcePath).isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      copyFolderRecursiveSync(sourcePath, target);
    } else {
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
} 