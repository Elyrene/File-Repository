(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/`,t=null;document.querySelector(`#sidebar`).addEventListener(`click`,e=>{let t=e.target.closest(`.nav-item`);if(!t)return;let r=t.dataset.page;n(r,t)});function n(e,t){document.querySelectorAll(`.nav-item`).forEach(e=>e.classList.remove(`active`)),t&&t.classList.add(`active`),document.querySelectorAll(`.page`).forEach(e=>e.classList.remove(`active`));let n=document.getElementById(`page-`+e);n&&n.classList.add(`active`),document.getElementById(`sidebar`).classList.remove(`open`),e===`status`&&i(),e===`files`&&u(),e===`config`&&C()}function r(e,t=`info`){let n=document.getElementById(`toastContainer`),r={success:`fa-check-circle`,error:`fa-circle-xmark`,info:`fa-circle-info`},i=document.createElement(`div`);i.className=`toast ${t}`,i.innerHTML=`<i class="fas ${r[t]||r.info}"></i><span>${e}</span>`,n.appendChild(i),setTimeout(()=>{i.style.animation=`toastOut 0.3s ease forwards`,setTimeout(()=>i.remove(),300)},3e3)}async function i(){try{t=await(await fetch(`/api/status`)).json(),a(t)}catch(e){console.error(`获取状态失败:`,e)}}function a(e){let t=document.getElementById(`statusGrid`);t.innerHTML=`
      <div class="stat-card">
        <div class="stat-label">状态</div>
        <div class="stat-value accent"><span class="status-dot"></span> 运行中</div>
        <div class="stat-sub">PID: ${e.pid}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">监听端口</div>
        <div class="stat-value info">${e.port}</div>
        <div class="stat-sub">0.0.0.0:${e.port}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Node.js 版本</div>
        <div class="stat-value">${e.nodeVersion}</div>
        <div class="stat-sub">${e.platform} / ${e.arch}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">RSS 内存</div>
        <div class="stat-value warning">${e.memory.rss}</div>
        <div class="stat-sub">堆: ${e.memory.heapUsed} / ${e.memory.heapTotal}</div>
      </div>
    `,document.getElementById(`uptimeDisplay`).textContent=e.uptime,document.getElementById(`startTimeDisplay`).textContent=`启动于 `+e.startTime,document.getElementById(`headerUptime`).textContent=e.uptime;let n=Math.min(e.uptimeSeconds/86400*100,100);document.getElementById(`uptimeBar`).style.width=n+`%`;let r=parseFloat(e.memory.heapUsed)/parseFloat(e.memory.heapTotal)*100,i=parseFloat(e.memory.rss),a=Math.min(i/(64*1024)*100,100),o=parseFloat(e.memory.external),s=Math.min(o/1024*100,100);document.getElementById(`memBars`).innerHTML=`
      <div class="mem-bar-item">
        <span class="mem-bar-label">Heap Used</span>
        <div class="mem-bar-track"><div class="mem-bar-fill heap" style="width:${r}%"></div></div>
        <span class="mem-bar-val">${e.memory.heapUsed}</span>
      </div>
      <div class="mem-bar-item">
        <span class="mem-bar-label">RSS</span>
        <div class="mem-bar-track"><div class="mem-bar-fill rss" style="width:${a}%"></div></div>
        <span class="mem-bar-val">${e.memory.rss}</span>
      </div>
      <div class="mem-bar-item">
        <span class="mem-bar-label">External</span>
        <div class="mem-bar-track"><div class="mem-bar-fill ext" style="width:${s}%"></div></div>
        <span class="mem-bar-val">${e.memory.external}</span>
      </div>
    `}function o(e){if(e==null)return`--`;if(e===0)return`0 B`;let t=[`B`,`KB`,`MB`,`GB`],n=Math.floor(Math.log(e)/Math.log(1024));return(e/1024**n).toFixed(+(n>0))+` `+t[n]}function s(e){let t=new Date(e),n=e=>String(e).padStart(2,`0`);return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function c(e,t){if(t)return`dir`;let n=e.split(`.`).pop().toLowerCase();return[`png`,`jpg`,`jpeg`,`gif`,`svg`,`webp`,`ico`,`bmp`].includes(n)?`img`:[`js`,`ts`,`jsx`,`tsx`,`html`,`css`,`json`,`xml`,`yaml`,`yml`,`md`,`py`,`rb`,`go`,`rs`,`java`,`c`,`cpp`,`h`,`sh`,`bat`].includes(n)?`code`:[`pdf`,`doc`,`docx`,`xls`,`xlsx`,`ppt`,`pptx`,`txt`,`csv`].includes(n)?`doc`:`default`}function l(e,t){return t?`fa-folder`:{html:`fa-html5`,css:`fa-css3-alt`,js:`fa-js`,json:`fa-brackets-curly`,png:`fa-image`,jpg:`fa-image`,jpeg:`fa-image`,gif:`fa-image`,svg:`fa-image`,webp:`fa-image`,pdf:`fa-file-pdf`,zip:`fa-file-zipper`,mp3:`fa-file-audio`,mp4:`fa-file-video`,md:`fa-file-lines`,txt:`fa-file-lines`}[e.split(`.`).pop().toLowerCase()]||`fa-file`}async function u(t){t!==void 0&&(e=t);try{let t=await(await fetch(`/api/files?path=`+encodeURIComponent(e))).json();if(t.error){r(t.error,`error`);return}d(t)}catch{r(`加载文件列表失败`,`error`)}}function d(t){e=t.path;let n=document.getElementById(`breadcrumb`),r=e.split(`/`).filter(Boolean),i=`<span class="breadcrumb-item" onclick="loadFiles('/')"><i class="fas fa-home" style="font-size:0.85rem;"></i></span>`,a=``;r.forEach((e,t)=>{a+=`/`+e;let n=a,o=t===r.length-1;i+=`<span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>`,i+=`<span class="breadcrumb-item" style="${o?`color:var(--fg);font-weight:500;`:``}" onclick="loadFiles('${n}')">${e}</span>`}),n.innerHTML=i;let u=document.getElementById(`fileTableBody`),d=document.getElementById(`fileEmpty`);if(!t.items||t.items.length===0){u.innerHTML=``,d.style.display=`block`;return}d.style.display=`none`,u.innerHTML=t.items.map(e=>`
        <tr>
          <td>
            <div class="file-name-cell">
              <div class="file-icon ${c(e.name,e.isDir)}"><i class="fas ${l(e.name,e.isDir)}"></i></div>
              ${e.isDir?`<span class="file-link dir-link" onclick="loadFiles('${e.path}')">${e.name}</span>`:`<a class="file-link" href="${e.path}" target="_blank">${e.name}</a>`}
            </div>
          </td>
          <td class="file-size">${e.isDir?`--`:o(e.size)}</td>
          <td class="file-time">${s(e.modified)}</td>
          <td>
            <div class="file-actions-cell">
              <button class="btn-icon danger" title="删除" onclick="showDeleteModal('${e.path}', ${e.isDir})">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join(``)}function f(){document.getElementById(`mkdirModal`).classList.remove(`show`)}async function p(){let t=document.getElementById(`mkdirInput`).value.trim();if(!t){r(`请输入目录名称`,`error`);return}if(t.includes(`..`)||t.includes(`/`)||t.includes(`\\`)){r(`目录名称不能包含特殊字符`,`error`);return}let n=(e===`/`?`/`:e+`/`)+t;f();try{let e=await(await fetch(`/api/mkdir`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({dirPath:n})})).json();e.error?r(e.error,`error`):(r(e.message,`success`),u())}catch{r(`创建目录失败`,`error`)}}document.getElementById(`mkdirInput`).addEventListener(`keydown`,e=>{e.key===`Enter`&&p(),e.key===`Escape`&&f()});var m=document.getElementById(`uploadZone`),h=document.getElementById(`uploadInput`);m.addEventListener(`dragover`,e=>{e.preventDefault(),m.classList.add(`dragover`)}),m.addEventListener(`dragleave`,e=>{e.preventDefault(),m.classList.remove(`dragover`)}),m.addEventListener(`drop`,e=>{e.preventDefault(),m.classList.remove(`dragover`),e.dataTransfer.files.length>0&&g(e.dataTransfer.files)}),h.addEventListener(`change`,e=>{e.target.files.length>0&&(g(e.target.files),e.target.value=``)});async function g(t){let n=document.getElementById(`uploadList`);for(let e of t){let t=document.createElement(`div`);t.className=`upload-item`,t.innerHTML=`
        <span class="upload-item-icon"><i class="fas fa-spinner fa-spin"></i></span>
        <span class="upload-item-name">${e.name}</span>
        <span class="upload-item-size">${o(e.size)}</span>
        <span class="upload-item-status uploading">上传中</span>
      `,n.prepend(t);try{let n=new FormData;n.append(`file`,e);let r=await(await fetch(`/api/upload`,{method:`POST`,body:n})).json();if(r.error)throw Error(r.error);t.querySelector(`.upload-item-icon`).innerHTML=`<i class="fas fa-check-circle"></i>`,t.querySelector(`.upload-item-status`).className=`upload-item-status success`,t.querySelector(`.upload-item-status`).textContent=`完成`}catch{t.querySelector(`.upload-item-icon`).innerHTML=`<i class="fas fa-circle-xmark"></i>`,t.querySelector(`.upload-item-icon`).style.color=`var(--danger)`,t.querySelector(`.upload-item-status`).className=`upload-item-status error`,t.querySelector(`.upload-item-status`).textContent=`失败`}}r(`已上传 ${t.length} 个文件到 /uploads`,`success`),e===`/uploads`&&u()}var _=document.getElementById(`logBody`),v=!1;function y(e,t,n){let r=new Date,i=e=>String(e).padStart(2,`0`),a=`${i(r.getHours())}:${i(r.getMinutes())}:${i(r.getSeconds())}`,o=e.toLowerCase(),s=n<400?`ok`:`err`,c=document.createElement(`div`);for(c.className=`log-line`,c.innerHTML=`
      <span class="log-time">${a}</span>
      <span class="log-method ${o}">${e.padEnd(6)}</span>
      <span class="log-path">${t}</span>
      <span class="log-status ${s}">${n}</span>
    `,v||=(_.innerHTML=``,!0),_.appendChild(c);_.children.length>200;)_.removeChild(_.firstChild);document.getElementById(`autoScroll`).checked&&(_.scrollTop=_.scrollHeight)}var b=window.fetch;window.fetch=async function(...e){let t=typeof e[0]==`string`?e[0]:e[0]?.url||``,n=((e[1]||{}).method||`GET`).toUpperCase();try{let r=await b.apply(this,e);return y(n,t,r.status),r}catch(e){throw y(n,t,0),e}};var x=document.querySelector(`#clearLogsBtn`);x&&x.addEventListener(`click`,S);function S(){_.innerHTML=``,v=!1;let e=document.createElement(`div`);e.className=`log-line`,e.innerHTML=`<span class="log-time">--:--:--</span><span class="log-path" style="color:#555;">日志已清空，等待新请求...</span>`,_.appendChild(e)}async function C(){try{let e=await(await fetch(`/api/status`)).json();document.getElementById(`configTable`).innerHTML=`
        <tr><td>监听地址</td><td>0.0.0.0</td></tr>
        <tr><td>监听端口</td><td>${e.port}</td></tr>
        <tr><td>静态根目录</td><td>${e.rootDir}</td></tr>
        <tr><td>默认首页</td><td>index.html</td></tr>
        <tr><td>缓存时间</td><td>3600 秒 (1 小时)</td></tr>
        <tr><td>上传目录</td><td>${e.rootDir}/uploads</td></tr>
        <tr><td>断点续传</td><td>已启用</td></tr>
        <tr><td>目录列表</td><td>已禁用 (仅通过面板查看)</td></tr>
        <tr><td>路径穿越防护</td><td>已启用</td></tr>
        <tr><td>Node.js 版本</td><td>${e.nodeVersion}</td></tr>
        <tr><td>操作系统</td><td>${e.platform} ${e.arch}</td></tr>
        <tr><td>进程 PID</td><td>${e.pid}</td></tr>
      `}catch{r(`加载配置失败`,`error`)}let e=[`.html`,`.css`,`.js`,`.json`,`.png`,`.jpg`,`.gif`,`.svg`,`.webp`,`.ico`,`.pdf`,`.zip`,`.mp3`,`.mp4`,`.webm`,`.woff`,`.woff2`,`.ttf`,`.md`,`.txt`,`.xml`,`.csv`];document.getElementById(`mimeList`).innerHTML=e.map(e=>`<span style="padding:4px 10px;background:var(--bg);border:1px solid var(--border);border-radius:20px;font-family:var(--font-mono);font-size:0.75rem;color:var(--fg-muted);">${e}</span>`).join(``)}document.querySelectorAll(`.modal-overlay`).forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&e.classList.remove(`show`)})}),setInterval(i,5e3),i(),u(`/`);