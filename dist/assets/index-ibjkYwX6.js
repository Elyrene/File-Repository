(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/`,t=null;function n(e,t=`info`){let n=document.getElementById(`toastContainer`),r={success:`fa-check-circle`,error:`fa-circle-xmark`,info:`fa-circle-info`},i=document.createElement(`div`);i.className=`toast ${t}`,i.innerHTML=`<i class="fas ${r[t]||r.info}"></i><span>${e}</span>`,n.appendChild(i),setTimeout(()=>{i.style.animation=`toastOut 0.3s ease forwards`,setTimeout(()=>i.remove(),300)},3e3)}async function r(){try{t=await(await fetch(`/api/status`)).json(),i(t)}catch(e){console.error(`获取状态失败:`,e)}}function i(e){let t=document.getElementById(`statusGrid`);t.innerHTML=`
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
    `}function a(e){if(e==null)return`--`;if(e===0)return`0 B`;let t=[`B`,`KB`,`MB`,`GB`],n=Math.floor(Math.log(e)/Math.log(1024));return(e/1024**n).toFixed(+(n>0))+` `+t[n]}function o(e){let t=new Date(e),n=e=>String(e).padStart(2,`0`);return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function s(e,t){if(t)return`dir`;let n=e.split(`.`).pop().toLowerCase();return[`png`,`jpg`,`jpeg`,`gif`,`svg`,`webp`,`ico`,`bmp`].includes(n)?`img`:[`js`,`ts`,`jsx`,`tsx`,`html`,`css`,`json`,`xml`,`yaml`,`yml`,`md`,`py`,`rb`,`go`,`rs`,`java`,`c`,`cpp`,`h`,`sh`,`bat`].includes(n)?`code`:[`pdf`,`doc`,`docx`,`xls`,`xlsx`,`ppt`,`pptx`,`txt`,`csv`].includes(n)?`doc`:`default`}function c(e,t){return t?`fa-folder`:{html:`fa-html5`,css:`fa-css3-alt`,js:`fa-js`,json:`fa-brackets-curly`,png:`fa-image`,jpg:`fa-image`,jpeg:`fa-image`,gif:`fa-image`,svg:`fa-image`,webp:`fa-image`,pdf:`fa-file-pdf`,zip:`fa-file-zipper`,mp3:`fa-file-audio`,mp4:`fa-file-video`,md:`fa-file-lines`,txt:`fa-file-lines`}[e.split(`.`).pop().toLowerCase()]||`fa-file`}async function l(t){t!==void 0&&(e=t);try{let t=await(await fetch(`/api/files?path=`+encodeURIComponent(e))).json();if(t.error){n(t.error,`error`);return}u(t)}catch{n(`加载文件列表失败`,`error`)}}function u(t){e=t.path;let n=document.getElementById(`breadcrumb`),r=e.split(`/`).filter(Boolean),i=`<span class="breadcrumb-item" onclick="loadFiles('/')"><i class="fas fa-home" style="font-size:0.85rem;"></i></span>`,l=``;r.forEach((e,t)=>{l+=`/`+e;let n=l,a=t===r.length-1;i+=`<span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>`,i+=`<span class="breadcrumb-item" style="${a?`color:var(--fg);font-weight:500;`:``}" onclick="loadFiles('${n}')">${e}</span>`}),n.innerHTML=i;let u=document.getElementById(`fileTableBody`),d=document.getElementById(`fileEmpty`);if(!t.items||t.items.length===0){u.innerHTML=``,d.style.display=`block`;return}d.style.display=`none`,u.innerHTML=t.items.map(e=>`
        <tr>
          <td>
            <div class="file-name-cell">
              <div class="file-icon ${s(e.name,e.isDir)}"><i class="fas ${c(e.name,e.isDir)}"></i></div>
              ${e.isDir?`<span class="file-link dir-link" onclick="loadFiles('${e.path}')">${e.name}</span>`:`<a class="file-link" href="${e.path}" target="_blank">${e.name}</a>`}
            </div>
          </td>
          <td class="file-size">${e.isDir?`--`:a(e.size)}</td>
          <td class="file-time">${o(e.modified)}</td>
          <td>
            <div class="file-actions-cell">
              <button class="btn-icon danger" title="删除" onclick="showDeleteModal('${e.path}', ${e.isDir})">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join(``)}function d(){document.getElementById(`mkdirModal`).classList.remove(`show`)}async function f(){let t=document.getElementById(`mkdirInput`).value.trim();if(!t){n(`请输入目录名称`,`error`);return}if(t.includes(`..`)||t.includes(`/`)||t.includes(`\\`)){n(`目录名称不能包含特殊字符`,`error`);return}let r=(e===`/`?`/`:e+`/`)+t;d();try{let e=await(await fetch(`/api/mkdir`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({dirPath:r})})).json();e.error?n(e.error,`error`):(n(e.message,`success`),l())}catch{n(`创建目录失败`,`error`)}}document.getElementById(`mkdirInput`).addEventListener(`keydown`,e=>{e.key===`Enter`&&f(),e.key===`Escape`&&d()});var p=document.getElementById(`uploadZone`),m=document.getElementById(`uploadInput`);p.addEventListener(`dragover`,e=>{e.preventDefault(),p.classList.add(`dragover`)}),p.addEventListener(`dragleave`,e=>{e.preventDefault(),p.classList.remove(`dragover`)}),p.addEventListener(`drop`,e=>{e.preventDefault(),p.classList.remove(`dragover`),e.dataTransfer.files.length>0&&h(e.dataTransfer.files)}),m.addEventListener(`change`,e=>{e.target.files.length>0&&(h(e.target.files),e.target.value=``)});async function h(t){let r=document.getElementById(`uploadList`);for(let e of t){let t=document.createElement(`div`);t.className=`upload-item`,t.innerHTML=`
        <span class="upload-item-icon"><i class="fas fa-spinner fa-spin"></i></span>
        <span class="upload-item-name">${e.name}</span>
        <span class="upload-item-size">${a(e.size)}</span>
        <span class="upload-item-status uploading">上传中</span>
      `,r.prepend(t);try{let n=new FormData;n.append(`file`,e);let r=await(await fetch(`/api/upload`,{method:`POST`,body:n})).json();if(r.error)throw Error(r.error);t.querySelector(`.upload-item-icon`).innerHTML=`<i class="fas fa-check-circle"></i>`,t.querySelector(`.upload-item-status`).className=`upload-item-status success`,t.querySelector(`.upload-item-status`).textContent=`完成`}catch{t.querySelector(`.upload-item-icon`).innerHTML=`<i class="fas fa-circle-xmark"></i>`,t.querySelector(`.upload-item-icon`).style.color=`var(--danger)`,t.querySelector(`.upload-item-status`).className=`upload-item-status error`,t.querySelector(`.upload-item-status`).textContent=`失败`}}n(`已上传 ${t.length} 个文件到 /uploads`,`success`),e===`/uploads`&&l()}var g=document.getElementById(`logBody`),_=!1;function v(e,t,n){let r=new Date,i=e=>String(e).padStart(2,`0`),a=`${i(r.getHours())}:${i(r.getMinutes())}:${i(r.getSeconds())}`,o=e.toLowerCase(),s=n<400?`ok`:`err`,c=document.createElement(`div`);for(c.className=`log-line`,c.innerHTML=`
      <span class="log-time">${a}</span>
      <span class="log-method ${o}">${e.padEnd(6)}</span>
      <span class="log-path">${t}</span>
      <span class="log-status ${s}">${n}</span>
    `,_||=(g.innerHTML=``,!0),g.appendChild(c);g.children.length>200;)g.removeChild(g.firstChild);document.getElementById(`autoScroll`).checked&&(g.scrollTop=g.scrollHeight)}var y=window.fetch;window.fetch=async function(...e){let t=typeof e[0]==`string`?e[0]:e[0]?.url||``,n=((e[1]||{}).method||`GET`).toUpperCase();try{let r=await y.apply(this,e);return v(n,t,r.status),r}catch(e){throw v(n,t,0),e}},document.querySelectorAll(`.modal-overlay`).forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&e.classList.remove(`show`)})}),setInterval(r,5e3),r(),l(`/`);