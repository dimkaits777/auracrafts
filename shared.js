/* ═══════════════════════════════════════════════════
   AURACRAFTS — shared.js
   Wishlist · Filter · Search · Pagination · Cards
   ═══════════════════════════════════════════════════ */
'use strict';

/* ─ Download counts (random, stable per session) ─ */
const DL = {};
function getDL(title){
  if(!DL[title]) DL[title] = 9 + Math.floor(Math.random() * 61);
  return DL[title];
}

/* ─ Escape helpers ────────────────────────────── */
function eh(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ea(s){return String(s).replace(/'/g,"&#39;")}

/* ─ Wishlist ──────────────────────────────────── */
const WK = 'ac_wish';
function getW(){try{return JSON.parse(localStorage.getItem(WK)||'[]')}catch{return[]}}
function saveW(l){localStorage.setItem(WK,JSON.stringify(l))}
function isW(a){return getW().some(p=>p.a===a)}

function toggleW(prod){
  let l = getW();
  const i = l.findIndex(p=>p.a===prod.a);
  if(i>-1){l.splice(i,1)}else{l.push(prod)}
  saveW(l);
  refreshW();
  toast(i>-1?'💔 Removed from wishlist':'❤️ Added to wishlist!');
}

function refreshW(){
  const wl = getW();
  const n = wl.length;
  document.querySelectorAll('.hdr-badge').forEach(el=>{
    el.textContent=n;
    el.classList.toggle('on',n>0);
  });
  document.querySelectorAll('.wish-btn').forEach(btn=>{
    const a=btn.dataset.a;
    btn.classList.toggle('on',isW(a));
    btn.textContent=isW(a)?'❤️':'🤍';
  });
  renderDrawer();
}

function renderDrawer(){
  const bd = document.querySelector('.drawer-bd');
  if(!bd)return;
  const l = getW();
  if(!l.length){
    bd.innerHTML=`<div class="drawer-empty"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><p>Your wishlist is empty</p></div>`;
    return;
  }
  bd.innerHTML=l.map(p=>`
    <div class="ditem">
      <img src="${eh(p.i)}" alt="${eh(p.t)}" loading="lazy" onerror="this.src='https://placehold.co/64x64/EDE0CE/A67850?text=✿'">
      <div class="ditem-info">
        <div class="ditem-title">${eh(p.t)}</div>
        <a class="ditem-dl" href="${eh(p.a)}" target="_blank" rel="noopener sponsored">⬇ Download</a>
      </div>
      <button class="ditem-rm" onclick="removeW('${ea(p.a)}')" title="Remove">✕</button>
    </div>`).join('');
}

function removeW(a){
  saveW(getW().filter(p=>p.a!==a));
  refreshW();
}

/* ─ Drawer ────────────────────────────────────── */
function openDrawer(){
  document.querySelector('.drawer')?.classList.add('on');
  document.querySelector('.overlay')?.classList.add('on');
  document.body.style.overflow='hidden';
}
function closeDrawer(){
  document.querySelector('.drawer')?.classList.remove('on');
  document.querySelector('.overlay')?.classList.remove('on');
  document.body.style.overflow='';
}

/* ─ Toast ─────────────────────────────────────── */
function toast(msg){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
  t.textContent=msg;t.classList.add('on');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2700);
}

/* ─ Card HTML ─────────────────────────────────── */
function cardHTML(p, badge){
  const dl = getDL(p.t);
  const hot = dl > 44;
  const bhtml = badge ? `<span class="${badge==='new'?'badge-new':'badge-hot'}">${badge==='new'?'New':'🔥 Hot'}</span>` : hot?'<span class="badge-hot">🔥 Hot</span>':'';
  return `
  <div class="pcard">
    <div class="pcard-img">
      ${bhtml}
      <img src="${eh(p.i)}" alt="${eh(p.t)}" loading="lazy" onerror="this.src='https://placehold.co/400x400/EDE0CE/A67850?text=✿'">
      <button class="wish-btn ${isW(p.a)?'on':''}" data-a="${ea(p.a)}" onclick="handleWish(this,event)" title="Save to wishlist">${isW(p.a)?'❤️':'🤍'}</button>
    </div>
    <div class="pcard-body">
      <h3 class="pcard-title">${eh(p.t)}</h3>
      <div class="pcard-meta">
        <span class="dl-cnt">🔥 ${dl} today</span>
        <span class="fmt-tag">Instant Download</span>
      </div>
      <a class="btn-dl" href="${eh(p.a)}" target="_blank" rel="noopener sponsored">
        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Click Here &amp; Download
      </a>
    </div>
  </div>`;
}

function handleWish(btn, e){
  e.preventDefault();e.stopPropagation();
  const a = btn.dataset.a;
  const card = btn.closest('.pcard');
  const t = card?.querySelector('.pcard-title')?.textContent||'';
  const i = card?.querySelector('img')?.src||'';
  // look in current PRODUCTS array if available
  const allProds = typeof window._prods !== 'undefined' ? window._prods : [];
  const found = allProds.find(x=>x.a===a)||{a,t,i};
  toggleW(found);
}

/* ─ Catalog state ─────────────────────────────── */
let _page=1, _cat='all', _q='', _sort='def';
const PER=24;

function _filtered(){
  const src = window._prods||[];
  let list = src;
  if(_cat!=='all') list=list.filter(p=>p.c===_cat);
  if(_q){const q=_q.toLowerCase();list=list.filter(p=>p.t.toLowerCase().includes(q))}
  if(_sort==='az') list=[...list].sort((a,b)=>a.t.localeCompare(b.t));
  if(_sort==='za') list=[...list].sort((a,b)=>b.t.localeCompare(a.t));
  return list;
}

function renderCatalog(grid){
  const all=_filtered();
  const total=all.length;
  const pages=Math.ceil(total/PER)||1;
  const slice=all.slice((_page-1)*PER,_page*PER);
  const cnt=document.querySelector('.shop-cnt');
  if(cnt) cnt.textContent=`Showing ${slice.length} of ${total.toLocaleString()} designs`;
  grid.innerHTML=slice.map(p=>cardHTML(p)).join('');
  renderPgn(pages);
  refreshW();
}

function renderPgn(pages){
  const pg=document.querySelector('.pgn');
  if(!pg)return;
  if(pages<=1){pg.innerHTML='';return}
  let html=`<button class="pgn-btn prev" onclick="goPage(${_page-1})" ${_page===1?'disabled':''}>← Prev</button>`;
  for(let i=1;i<=pages;i++){
    if(pages>7&&i>2&&i<pages-1&&Math.abs(i-_page)>2){
      if(i===3||i===pages-2) html+=`<span style="padding:0 4px;color:var(--muted)">…</span>`;
      continue;
    }
    html+=`<button class="pgn-btn ${i===_page?'on':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html+=`<button class="pgn-btn next" onclick="goPage(${_page+1})" ${_page===pages?'disabled':''}>Next →</button>`;
  pg.innerHTML=html;
}

function goPage(n){
  const pages=Math.ceil(_filtered().length/PER)||1;
  if(n<1||n>pages)return;
  _page=n;
  const g=document.querySelector('.pgrid');
  if(g)renderCatalog(g);
  const top=document.querySelector('.shop-lay')?.offsetTop||0;
  window.scrollTo({top:top-80,behavior:'smooth'});
}

function setCat(cat){
  _cat=cat;_page=1;
  document.querySelectorAll('.fl-row,.fchip').forEach(el=>el.classList.toggle('on',el.dataset.cat===cat));
  const g=document.querySelector('.pgrid');
  if(g)renderCatalog(g);
}

/* ─ Nav active ────────────────────────────────── */
function setActive(){
  const pg=(location.pathname.split('/').pop()||'index.html').split('?')[0];
  document.querySelectorAll('.nav-a,.mob-nav a').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('?')[0];
    a.classList.toggle('cur',href===pg||(pg===''&&href==='index.html'));
  });
}

/* ─ Scroll header ─────────────────────────────── */
function initScrollHeader(){
  const hdr=document.querySelector('.hdr');
  if(!hdr)return;
  const check=()=>hdr.classList.toggle('on',scrollY>60);
  window.addEventListener('scroll',check,{passive:true});
  check();
}

/* ─ Burger ────────────────────────────────────── */
function initBurger(){
  const btn=document.querySelector('.burger');
  const nav=document.querySelector('.mob-nav');
  if(!btn||!nav)return;
  btn.addEventListener('click',()=>{
    nav.classList.toggle('on');
    document.body.style.overflow=nav.classList.contains('on')?'hidden':'';
  });
}

/* ─ Pinterest share ───────────────────────────── */
function pinShare(){
  const url=encodeURIComponent(location.href);
  const desc=encodeURIComponent(document.title);
  window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${desc}`,'_blank','width=750,height=550');
}

/* ─ Subscribe form ────────────────────────────── */
function handleSub(e){
  e.preventDefault();
  toast('✉️ Thank you — you\'re subscribed!');
  e.target.reset();
  return false;
}

/* ─ Init ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  setActive();
  initScrollHeader();
  initBurger();
  refreshW();

  // Wishlist icon -> open drawer
  document.querySelectorAll('.wish-open').forEach(el=>el.addEventListener('click',openDrawer));
  document.querySelector('.drawer-x')?.addEventListener('click',closeDrawer);
  document.querySelector('.overlay')?.addEventListener('click',closeDrawer);

  // Shop page
  const grid=document.querySelector('.pgrid');
  if(grid&&typeof window._prods!=='undefined'){
    const params=new URLSearchParams(location.search);
    if(params.get('cat')) _cat=params.get('cat');
    if(params.get('q')) _q=params.get('q');

    // URL cat => highlight filter
    if(_cat!=='all'){
      document.querySelectorAll('.fl-row,.fchip').forEach(el=>{
        el.classList.toggle('on',el.dataset.cat===_cat);
      });
    }

    // Search
    const si=document.querySelector('#shopSearch');
    if(si){
      si.value=_q;
      si.addEventListener('input',()=>{_q=si.value.trim();_page=1;renderCatalog(grid)});
    }
    // Sort
    const ss=document.querySelector('#shopSort');
    if(ss) ss.addEventListener('change',()=>{_sort=ss.value;_page=1;renderCatalog(grid)});
    // Filter rows
    document.querySelectorAll('.fl-row').forEach(el=>{
      el.addEventListener('click',()=>setCat(el.dataset.cat));
    });
    // Filter chips
    document.querySelectorAll('.fchip').forEach(el=>{
      el.addEventListener('click',()=>setCat(el.dataset.cat));
    });
    // Sidebar toggle (mobile)
    document.querySelector('.shop-tog')?.addEventListener('click',()=>{
      document.querySelector('.shop-side')?.classList.toggle('on');
    });

    renderCatalog(grid);
  }
});
