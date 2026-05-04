// const http = require("http");
// const { request } = require("https");

// http
//     .createServer((request,Response) => {
//         Response.writeHead(200, { "Content-Type": "text/plain"});

//         Response.end("hello world\n");
//     })
//     .listen(8000);


// console.log("服务器运行于 http://127.0.0.0:8000/");

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ==================== 配置 ====================
const CONFIG = {
  port: process.env.PORT || 3000,
  host: '0.0.0.0',
  rootDir: path.join(__dirname, 'public'),   // 静态文件根目录
  indexFile: 'index.html',                    // 默认首页
  maxAge: 3600,                               // 缓存时间（秒）
  uploadDir: path.join(__dirname, 'public', 'uploads'), // 上传目录
};

// ==================== MIME 类型映射 ====================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.pdf':  'application/pdf',
  '.zip':  'application/zip',
  '.gz':   'application/gzip',
  '.tar':  'application/x-tar',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.eot':  'application/vnd.ms-fontobject',
  '.md':   'text/markdown; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.csv':  'text/csv; charset=utf-8',
};

// ==================== 工具函数 ====================

/** 获取文件扩展名对应的 MIME 类型 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/** 格式化文件大小 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

/** 格式化时间 */
function formatTime(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 递归获取目录结构 */
function getDirectoryTree(dirPath, relativePath = '') {
  const items = [];
  let fullPath = path.join(dirPath, relativePath);

  if (!fs.existsSync(fullPath)) return items;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    // 隐藏文件跳过
    if (entry.name.startsWith('.')) continue;

    const itemRelPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
    const itemFullPath = path.join(fullPath, entry.name);
    const stats = fs.statSync(itemFullPath);

    items.push({
      name: entry.name,
      path: '/' + itemRelPath,
      isDir: entry.isDirectory(),
      size: entry.isFile() ? stats.size : null,
      modified: stats.mtime,
      children: entry.isDirectory() ? getDirectoryTree(dirPath, itemRelPath) : null,
    });
  }

  // 排序：目录优先，然后按名称
  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

/** 解析 Range 头，支持断点续传 */
function parseRange(rangeHeader, fileSize) {
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  return { start: Math.max(0, start), end: Math.min(fileSize - 1, end) };
}

// ==================== 请求处理 ====================

/** 处理静态文件请求 */
function serveStatic(req, res, filePath) {
  // 安全检查：防止路径穿越
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(CONFIG.rootDir);
  if (!resolvedPath.startsWith(resolvedRoot)) {
    return sendError(res, 403, '禁止访问');
  }

  // 检查文件是否存在
  if (!fs.existsSync(resolvedPath)) {
    return sendError(res, 404, '文件未找到');
  }

  const stats = fs.statSync(resolvedPath);

  // 如果是目录，尝试返回 index.html
  if (stats.isDirectory()) {
    const indexPath = path.join(resolvedPath, CONFIG.indexFile);
    if (fs.existsSync(indexPath)) {
      return serveStatic(req, res, indexPath);
    }
    return sendError(res, 403, '目录列表已禁用');
  }

  const mimeType = getMimeType(resolvedPath);
  const fileSize = stats.size;

  // 处理 Range 请求（断点续传）
  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    try {
      const { start, end } = parseRange(rangeHeader, fileSize);
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Type': mimeType,
        'Content-Length': chunkSize,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': `public, max-age=${CONFIG.maxAge}`,
        'Last-Modified': stats.mtime.toUTCString(),
      });

      fs.createReadStream(resolvedPath, { start, end }).pipe(res);
      return;
    } catch (e) {
      // Range 解析失败，忽略，返回完整文件
    }
  }

  // 常规响应
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': fileSize,
    'Cache-Control': `public, max-age=${CONFIG.maxAge}`,
    'Last-Modified': stats.mtime.toUTCString(),
    'Accept-Ranges': 'bytes',
  });

  fs.createReadStream(resolvedPath).pipe(res);
}

/** 处理 API：获取文件列表 */
function handleAPIFiles(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const dirPath = urlObj.searchParams.get('path') || '/';
  const fullPath = path.join(CONFIG.rootDir, dirPath);

  // 安全检查
  const resolvedPath = path.resolve(fullPath);
  const resolvedRoot = path.resolve(CONFIG.rootDir);
  if (!resolvedPath.startsWith(resolvedRoot)) {
    return sendJSON(res, 403, { error: '禁止访问' });
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    return sendJSON(res, 404, { error: '目录不存在' });
  }

  const tree = getDirectoryTree(CONFIG.rootDir, dirPath.replace(/^\//, ''));
  sendJSON(res, 200, { path: dirPath, items: tree });
}

/** 处理 API：获取服务器状态 */
function handleAPIStatus(req, res) {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  // 获取内存使用
  const memUsage = process.memoryUsage();

  sendJSON(res, 200, {
    status: 'running',
    port: CONFIG.port,
    rootDir: CONFIG.rootDir,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeSeconds: Math.floor(uptime),
    memory: {
      rss: formatSize(memUsage.rss),
      heapUsed: formatSize(memUsage.heapUsed),
      heapTotal: formatSize(memUsage.heapTotal),
      external: formatSize(memUsage.external),
    },
    startTime: formatTime(Date.now() - uptime * 1000),
  });
}

/** 处理 API：文件上传 */
function handleAPIUpload(req, res) {
  // 确保上传目录存在
  if (!fs.existsSync(CONFIG.uploadDir)) {
    fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
  }

  const contentType = req.headers['content-type'] || '';
  let boundary = '';
  const match = contentType.match(/boundary=(.+)$/);
  if (match) boundary = '--' + match[1];

  if (!boundary) {
    return sendJSON(res, 400, { error: '无效的请求格式' });
  }

  let buffer = Buffer.alloc(0);
  req.on('data', chunk => { buffer = Buffer.concat([buffer, chunk]); });
  req.on('end', () => {
    try {
      const str = buffer.toString('latin1');
      const parts = str.split(boundary);

      const uploadedFiles = [];

      for (const part of parts) {
        if (part.includes('Content-Disposition')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (!filenameMatch) continue;
          const filename = filenameMatch[1];
          const fileData = part.split('\r\n\r\n').slice(1).join('\r\n\r\n');
          // 去掉末尾的 \r\n
          const cleanData = fileData.substring(0, fileData.length - 2);
          const fileBuffer = Buffer.from(cleanData, 'latin1');

          const savePath = path.join(CONFIG.uploadDir, filename);
          fs.writeFileSync(savePath, fileBuffer);
          uploadedFiles.push({
            name: filename,
            size: formatSize(fileBuffer.length),
            path: '/uploads/' + filename,
          });
        }
      }

      sendJSON(res, 200, { message: `成功上传 ${uploadedFiles.length} 个文件`, files: uploadedFiles });
    } catch (e) {
      sendJSON(res, 500, { error: '上传失败: ' + e.message });
    }
  });
}

/** 处理 API：删除文件 */
function handleAPIDelete(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { filePath } = JSON.parse(body);
      const fullPath = path.join(CONFIG.rootDir, filePath);
      const resolvedPath = path.resolve(fullPath);
      const resolvedRoot = path.resolve(CONFIG.rootDir);

      if (!resolvedPath.startsWith(resolvedRoot)) {
        return sendJSON(res, 403, { error: '禁止操作' });
      }

      if (!fs.existsSync(resolvedPath)) {
        return sendJSON(res, 404, { error: '文件不存在' });
      }

      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        fs.rmSync(resolvedPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(resolvedPath);
      }

      sendJSON(res, 200, { message: '删除成功', path: filePath });
    } catch (e) {
      sendJSON(res, 500, { error: '删除失败: ' + e.message });
    }
  });
}

/** 处理 API：创建目录 */
function handleAPIMkdir(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { dirPath } = JSON.parse(body);
      const fullPath = path.join(CONFIG.rootDir, dirPath);
      const resolvedPath = path.resolve(fullPath);
      const resolvedRoot = path.resolve(CONFIG.rootDir);

      if (!resolvedPath.startsWith(resolvedRoot)) {
        return sendJSON(res, 403, { error: '禁止操作' });
      }

      if (fs.existsSync(resolvedPath)) {
        return sendJSON(res, 400, { error: '目录已存在' });
      }

      fs.mkdirSync(resolvedPath, { recursive: true });
      sendJSON(res, 200, { message: '目录创建成功', path: dirPath });
    } catch (e) {
      sendJSON(res, 500, { error: '创建失败: ' + e.message });
    }
  });
}

// ==================== 响应工具 ====================

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// function sendError(res, statusCode, message) {
//   // 如果是浏览器请求且不是 API，返回美化错误页
//   const accept = req => req.headers.accept || '';
//   // 这里我们统一返回 JSON 错误，前端来处理
//   sendJSON(res, statusCode, { error: message, code: statusCode });
// }

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message, code: statusCode });
}


// ==================== 日志 ====================

const LOG_COLORS = {
  GET:    '\x1b[36m', // 青色
  POST:   '\x1b[32m', // 绿色
  DELETE: '\x1b[31m', // 红色
  PUT:    '\x1b[33m', // 黄色
};

function logRequest(method, urlPath, statusCode, size) {
  const color = LOG_COLORS[method] || '\x1b[0m';
  const reset = '\x1b[0m';
  const statusColor = statusCode < 400 ? '\x1b[32m' : '\x1b[31m';
  const timestamp = new Date().toLocaleTimeString();
  const sizeStr = size ? ` ${formatSize(size)}` : '';
  console.log(`${color}${method.padEnd(6)}${reset} ${timestamp} ${statusColor}${statusCode}${reset} ${urlPath}${sizeStr}`);
}

// ==================== 主请求处理器 ====================

function handleRequest(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const urlPath = urlObj.pathname;
  const method = req.method;

  // 路由分发
  if (urlPath === '/api/status' && method === 'GET') {
    return handleAPIStatus(req, res);
  }

  if (urlPath === '/api/files' && method === 'GET') {
    return handleAPIFiles(req, res);
  }

  if (urlPath === '/api/upload' && method === 'POST') {
    return handleAPIUpload(req, res);
  }

  if (urlPath === '/api/delete' && method === 'POST') {
    return handleAPIDelete(req, res);
  }

  if (urlPath === '/api/mkdir' && method === 'POST') {
    return handleAPIMkdir(req, res);
  }

  // 静态文件服务
  const filePath = path.join(CONFIG.rootDir, urlPath);
  serveStatic(req, res, filePath);

  // 异步记录日志（在 send 之后）
  const stats = req._responseSize || 0;
  logRequest(method, urlPath, res.statusCode, stats);
}

// ==================== 启动服务器 ====================

// 确保必要的目录存在
if (!fs.existsSync(CONFIG.rootDir)) {
  fs.mkdirSync(CONFIG.rootDir, { recursive: true });
}
if (!fs.existsSync(CONFIG.uploadDir)) {
  fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
}

const server = http.createServer(handleRequest);

server.listen(CONFIG.port, CONFIG.host, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║                                           ║');
  console.log('  ║        静态文件服务器已启动                 ║');
  console.log('  ║                                           ║');
  console.log(`  ║   地址: http://localhost:${CONFIG.port}          ║`);
  console.log(`  ║   根目录: ${CONFIG.rootDir.padEnd(28)}║`);
  console.log(`  ║   Node: ${process.version.padEnd(33)}║`);
  console.log('  ║                                           ║');
  console.log('  ║   按 Ctrl+C 停止服务器                     ║');
  console.log('  ║                                           ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n  正在关闭服务器...');
  server.close(() => {
    console.log('  服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

module.exports = server;
