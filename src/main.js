import './style.css';

// ==================== 状态管理 ====================
let currentPath = '/';
let pendingDeletePath = null;
let serverStatus = null;
const logEntries = [];

// ==================== 页面切换 ====================
function switchPage(pageId, navEl) {
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (navEl) navEl.classList.add('active');

    // 更新页面
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    // 关闭移动端侧边栏
    document.getElementById('sidebar').classList.remove('open');

    // 页面进入时刷新数据
    if (pageId === 'status') refreshStatus();
    if (pageId === 'files') loadFiles();
    if (pageId === 'config') loadConfig();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ==================== Toast 通知 ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== 服务器状态 ====================
async function refreshStatus() {
    try {
        const resp = await fetch('/api/status');
        serverStatus = await resp.json();
        renderStatus(serverStatus);
    } catch (e) {
        console.error('获取状态失败:', e);
    }
}

function renderStatus(s) {
    // 状态卡片
    const grid = document.getElementById('statusGrid');
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">状态</div>
        <div class="stat-value accent"><span class="status-dot"></span> 运行中</div>
        <div class="stat-sub">PID: ${s.pid}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">监听端口</div>
        <div class="stat-value info">${s.port}</div>
        <div class="stat-sub">0.0.0.0:${s.port}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Node.js 版本</div>
        <div class="stat-value">${s.nodeVersion}</div>
        <div class="stat-sub">${s.platform} / ${s.arch}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">RSS 内存</div>
        <div class="stat-value warning">${s.memory.rss}</div>
        <div class="stat-sub">堆: ${s.memory.heapUsed} / ${s.memory.heapTotal}</div>
      </div>
    `;

    // 运行时间
    document.getElementById('uptimeDisplay').textContent = s.uptime;
    document.getElementById('startTimeDisplay').textContent = '启动于 ' + s.startTime;
    document.getElementById('headerUptime').textContent = s.uptime;

    // 运行时间条（24小时为一圈）
    const pct = Math.min((s.uptimeSeconds / 86400) * 100, 100);
    document.getElementById('uptimeBar').style.width = pct + '%';

    // 内存条
    const heapPct = parseFloat(s.memory.heapUsed) / parseFloat(s.memory.heapTotal) * 100;
    // 估算 RSS 基数（假设 64MB 基准）
    const rssNum = parseFloat(s.memory.rss);
    const rssPct = Math.min(rssNum / (64 * 1024) * 100, 100);
    const extNum = parseFloat(s.memory.external);
    const extPct = Math.min(extNum / 1024 * 100, 100);

    document.getElementById('memBars').innerHTML = `
      <div class="mem-bar-item">
        <span class="mem-bar-label">Heap Used</span>
        <div class="mem-bar-track"><div class="mem-bar-fill heap" style="width:${heapPct}%"></div></div>
        <span class="mem-bar-val">${s.memory.heapUsed}</span>
      </div>
      <div class="mem-bar-item">
        <span class="mem-bar-label">RSS</span>
        <div class="mem-bar-track"><div class="mem-bar-fill rss" style="width:${rssPct}%"></div></div>
        <span class="mem-bar-val">${s.memory.rss}</span>
      </div>
      <div class="mem-bar-item">
        <span class="mem-bar-label">External</span>
        <div class="mem-bar-track"><div class="mem-bar-fill ext" style="width:${extPct}%"></div></div>
        <span class="mem-bar-val">${s.memory.external}</span>
      </div>
    `;
}

// ==================== 文件浏览 ====================
function formatSizeUI(bytes) {
    if (bytes === null || bytes === undefined) return '--';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function formatTimeUI(dateStr) {
    const d = new Date(dateStr);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getFileIconClass(name, isDir) {
    if (isDir) return 'dir';
    const ext = name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) return 'img';
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sh', 'bat'].includes(ext)) return 'code';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'doc';
    return 'default';
}

function getFileIconFA(name, isDir) {
    if (isDir) return 'fa-folder';
    const ext = name.split('.').pop().toLowerCase();
    const map = {
        'html': 'fa-html5', 'css': 'fa-css3-alt', 'js': 'fa-js',
        'json': 'fa-brackets-curly', 'png': 'fa-image', 'jpg': 'fa-image',
        'jpeg': 'fa-image', 'gif': 'fa-image', 'svg': 'fa-image',
        'webp': 'fa-image', 'pdf': 'fa-file-pdf', 'zip': 'fa-file-zipper',
        'mp3': 'fa-file-audio', 'mp4': 'fa-file-video',
        'md': 'fa-file-lines', 'txt': 'fa-file-lines',
    };
    return map[ext] || 'fa-file';
}

async function loadFiles(dirPath) {
    if (dirPath !== undefined) currentPath = dirPath;
    try {
        const resp = await fetch('/api/files?path=' + encodeURIComponent(currentPath));
        const data = await resp.json();
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        renderFiles(data);
    } catch (e) {
        showToast('加载文件列表失败', 'error');
    }
}

function renderFiles(data) {
    currentPath = data.path;

    // 面包屑
    const bc = document.getElementById('breadcrumb');
    const parts = currentPath.split('/').filter(Boolean);
    let bcHtml = `<span class="breadcrumb-item" onclick="loadFiles('/')"><i class="fas fa-home" style="font-size:0.85rem;"></i></span>`;
    let accumulated = '';
    parts.forEach((part, i) => {
        accumulated += '/' + part;
        const p = accumulated;
        const isLast = i === parts.length - 1;
        bcHtml += `<span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>`;
        bcHtml += `<span class="breadcrumb-item" style="${isLast ? 'color:var(--fg);font-weight:500;' : ''}" onclick="loadFiles('${p}')">${part}</span>`;
    });
    bc.innerHTML = bcHtml;

    // 文件表格
    const tbody = document.getElementById('fileTableBody');
    const empty = document.getElementById('fileEmpty');

    if (!data.items || data.items.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = data.items.map(item => {
        const iconClass = getFileIconClass(item.name, item.isDir);
        const iconFA = getFileIconFA(item.name, item.isDir);
        const nameLink = item.isDir
            ? `<span class="file-link dir-link" onclick="loadFiles('${item.path}')">${item.name}</span>`
            : `<a class="file-link" href="${item.path}" target="_blank">${item.name}</a>`;

        return `
        <tr>
          <td>
            <div class="file-name-cell">
              <div class="file-icon ${iconClass}"><i class="fas ${iconFA}"></i></div>
              ${nameLink}
            </div>
          </td>
          <td class="file-size">${item.isDir ? '--' : formatSizeUI(item.size)}</td>
          <td class="file-time">${formatTimeUI(item.modified)}</td>
          <td>
            <div class="file-actions-cell">
              <button class="btn-icon danger" title="删除" onclick="showDeleteModal('${item.path}', ${item.isDir})">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
}

// ==================== 新建目录 ====================
function showMkdirModal() {
    document.getElementById('mkdirPath').textContent = currentPath;
    document.getElementById('mkdirInput').value = '';
    document.getElementById('mkdirModal').classList.add('show');
    setTimeout(() => document.getElementById('mkdirInput').focus(), 100);
}

function closeMkdirModal() {
    document.getElementById('mkdirModal').classList.remove('show');
}

async function createDir() {
    const name = document.getElementById('mkdirInput').value.trim();
    if (!name) {
        showToast('请输入目录名称', 'error');
        return;
    }
    // 安全检查
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
        showToast('目录名称不能包含特殊字符', 'error');
        return;
    }

    const dirPath = (currentPath === '/' ? '/' : currentPath + '/') + name;
    closeMkdirModal();

    try {
        const resp = await fetch('/api/mkdir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dirPath }),
        });
        const data = await resp.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast(data.message, 'success');
            loadFiles();
        }
    } catch (e) {
        showToast('创建目录失败', 'error');
    }
}

// 回车创建
document.getElementById('mkdirInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') createDir();
    if (e.key === 'Escape') closeMkdirModal();
});

// ==================== 删除文件 ====================
function showDeleteModal(filePath, isDir) {
    pendingDeletePath = filePath;
    document.getElementById('deletePath').textContent = filePath + (isDir ? ' (目录)' : '');
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    pendingDeletePath = null;
}

async function confirmDelete() {
    if (!pendingDeletePath) return;
    const filePath = pendingDeletePath;
    closeDeleteModal();

    try {
        const resp = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath }),
        });
        const data = await resp.json();
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast(data.message, 'success');
            loadFiles();
        }
    } catch (e) {
        showToast('删除失败', 'error');
    }
}

// ==================== 文件上传 ====================
const uploadZone = document.getElementById('uploadZone');
const uploadInput = document.getElementById('uploadInput');

uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
    }
});

uploadInput.addEventListener('change', e => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files);
        e.target.value = ''; // 重置，允许再次选同文件
    }
});

async function handleUpload(files) {
    const list = document.getElementById('uploadList');

    for (const file of files) {
        // 添加上传项
        const item = document.createElement('div');
        item.className = 'upload-item';
        item.innerHTML = `
        <span class="upload-item-icon"><i class="fas fa-spinner fa-spin"></i></span>
        <span class="upload-item-name">${file.name}</span>
        <span class="upload-item-size">${formatSizeUI(file.size)}</span>
        <span class="upload-item-status uploading">上传中</span>
      `;
        list.prepend(item);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const resp = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();

            if (data.error) throw new Error(data.error);

            item.querySelector('.upload-item-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
            item.querySelector('.upload-item-status').className = 'upload-item-status success';
            item.querySelector('.upload-item-status').textContent = '完成';
        } catch (e) {
            item.querySelector('.upload-item-icon').innerHTML = '<i class="fas fa-circle-xmark"></i>';
            item.querySelector('.upload-item-icon').style.color = 'var(--danger)';
            item.querySelector('.upload-item-status').className = 'upload-item-status error';
            item.querySelector('.upload-item-status').textContent = '失败';
        }
    }

    showToast(`已上传 ${files.length} 个文件到 /uploads`, 'success');
    // 刷新文件列表（如果当前在上传目录）
    if (currentPath === '/uploads') loadFiles();
}

// ==================== 请求日志 ====================
// 由于无法真正拦截所有请求，我们用模拟日志 + 定时获取状态来展示
const logBody = document.getElementById('logBody');
let logInitialized = false;

// 生成模拟日志（基于真实的页面请求）
function addLogEntry(method, path, status) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const methodClass = method.toLowerCase();
    const statusClass = status < 400 ? 'ok' : 'err';

    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-method ${methodClass}">${method.padEnd(6)}</span>
      <span class="log-path">${path}</span>
      <span class="log-status ${statusClass}">${status}</span>
    `;

    // 移除初始占位
    if (!logInitialized) {
        logBody.innerHTML = '';
        logInitialized = true;
    }

    logBody.appendChild(line);

    // 限制日志数量
    while (logBody.children.length > 200) {
        logBody.removeChild(logBody.firstChild);
    }

    // 自动滚动
    if (document.getElementById('autoScroll').checked) {
        logBody.scrollTop = logBody.scrollHeight;
    }
}

// 拦截 fetch 请求来记录日志
const originalFetch = window.fetch;
window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    const method = (options.method || 'GET').toUpperCase();

    try {
        const resp = await originalFetch.apply(this, args);
        addLogEntry(method, url, resp.status);
        return resp;
    } catch (e) {
        addLogEntry(method, url, 0);
        throw e;
    }
};

function clearLogs() {
    logBody.innerHTML = '';
    logInitialized = false;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">--:--:--</span><span class="log-path" style="color:#555;">日志已清空，等待新请求...</span>`;
    logBody.appendChild(line);
}

// ==================== 配置页 ====================
async function loadConfig() {
    try {
        const resp = await fetch('/api/status');
        const s = await resp.json();

        document.getElementById('configTable').innerHTML = `
        <tr><td>监听地址</td><td>0.0.0.0</td></tr>
        <tr><td>监听端口</td><td>${s.port}</td></tr>
        <tr><td>静态根目录</td><td>${s.rootDir}</td></tr>
        <tr><td>默认首页</td><td>index.html</td></tr>
        <tr><td>缓存时间</td><td>3600 秒 (1 小时)</td></tr>
        <tr><td>上传目录</td><td>${s.rootDir}/uploads</td></tr>
        <tr><td>断点续传</td><td>已启用</td></tr>
        <tr><td>目录列表</td><td>已禁用 (仅通过面板查看)</td></tr>
        <tr><td>路径穿越防护</td><td>已启用</td></tr>
        <tr><td>Node.js 版本</td><td>${s.nodeVersion}</td></tr>
        <tr><td>操作系统</td><td>${s.platform} ${s.arch}</td></tr>
        <tr><td>进程 PID</td><td>${s.pid}</td></tr>
      `;
    } catch (e) {
        showToast('加载配置失败', 'error');
    }

    // MIME 类型列表
    const mimes = [
        '.html', '.css', '.js', '.json', '.png', '.jpg', '.gif', '.svg', '.webp', '.ico',
        '.pdf', '.zip', '.mp3', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.md', '.txt', '.xml', '.csv'
    ];
    document.getElementById('mimeList').innerHTML = mimes.map(m =>
        `<span style="padding:4px 10px;background:var(--bg);border:1px solid var(--border);border-radius:20px;font-family:var(--font-mono);font-size:0.75rem;color:var(--fg-muted);">${m}</span>`
    ).join('');
}

// ==================== 模态框关闭（点击遮罩） ====================
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
        }
    });
});

// ==================== 定时刷新状态 ====================
setInterval(refreshStatus, 5000);

// ==================== 初始化 ====================
refreshStatus();
loadFiles('/');
