const POSTS_URL = './data.json';
const ITEMS_PER_PAGE = 6;

let state = {
  posts: [],
  filtered: [],
  currentCategory: 'all',
  query: '',
  currentPage: 1,
  totalPages: 1
};

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

const formatDate = iso => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  } catch {
    return iso;
  }
};

async function loadPosts(){
  try {
    const res = await fetch(POSTS_URL, {cache: "no-cache"});
    const data = await res.json();
    data.posts.sort((a,b)=> new Date(b.updated) - new Date(a.updated));
    state.posts = data.posts;
    applyFilters();
  } catch (err) {
    console.error('Failed to load posts', err);
    qs('#cards').innerHTML = `<div class="empty" style="padding:24px;border-radius:12px;background:rgba(255,255,255,0.8);text-align:center">Unable to load content. Try again later.</div>`;
  }
}

function applyFilters(){
  const cat = state.currentCategory;
  const q = state.query.trim().toLowerCase();

  state.filtered = state.posts.filter(p =>
    (cat === 'all' || p.category === cat) &&
    (q === '' || p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
  );

  state.totalPages = Math.max(1, Math.ceil(state.filtered.length / ITEMS_PER_PAGE));
  if(state.currentPage > state.totalPages) state.currentPage = state.totalPages;
  render();
}

function render(){
  renderCards();
  renderPagination();
  updateNavActive();
}

function renderCards(){
  const container = qs('#cards');
  container.innerHTML = '';

  const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
  const visible = state.filtered.slice(start, start + ITEMS_PER_PAGE);

  if(visible.length === 0){
    container.innerHTML = `<div class="empty" style="padding:40px;border-radius:12px;background:rgba(255,255,255,0.6);text-align:center">No results found.</div>`;
    return;
  }

  for(const p of visible){
    const card = document.createElement('article');
    card.className = 'card';
    const thumbUrl = p.thumbnail || 'details/images/logo.png';

    card.innerHTML = `
      <div class="thumb" style="background-image:url('${escapeHtml(thumbUrl)}')" role="img" aria-label="${escapeHtml(p.title)} thumbnail">
        <div class="badge">${escapeHtml(p.category.toUpperCase())}</div>
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${formatDate(p.updated)}</div>
      <div class="genres">${(p.genres||[]).map(g=>`<div class="genre">${escapeHtml(g)}</div>`).join('')}</div>
      <p class="desc">${escapeHtml(p.description)}</p>
      <div class="actions">
        <button class="btn" data-link="${escapeHtml(p.download_link || '')}">Details</button>
      </div>
    `;

    const dlBtn = card.querySelector('.btn');
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const link = dlBtn.dataset.link;
      if (link) window.location.href = link;
      else alert('No details page available.');
    });

    card.addEventListener('click', () => {
      if (p.download_link) window.location.href = p.download_link;
    });

    container.appendChild(card);
  }
}

function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
}

function renderPagination(){
  const pageNumbers = qs('#pageNumbers');
  pageNumbers.innerHTML = '';
  const total = state.totalPages;
  const current = state.currentPage;
  const maxShow = 7;
  let start = Math.max(1, current - Math.floor(maxShow/2));
  let end = Math.min(total, start + maxShow - 1);
  if(end - start + 1 < maxShow){ start = Math.max(1, end - maxShow + 1); }

  for(let i=start;i<=end;i++){
    const btn=document.createElement('button');
    btn.className='page-num'+(i===current?' active':'');
    btn.textContent=i;
    btn.onclick=()=>{ state.currentPage=i; render(); window.scrollTo({top:0,behavior:'smooth'}); };
    pageNumbers.appendChild(btn);
  }
  qs('#prevBtn').disabled=current===1;
  qs('#nextBtn').disabled=current===total;
  qs('#prevBtn').onclick=()=>{ if(state.currentPage>1){ state.currentPage--; render(); window.scrollTo({top:0,behavior:'smooth'}); } };
  qs('#nextBtn').onclick=()=>{ if(state.currentPage<total){ state.currentPage++; render(); window.scrollTo({top:0,behavior:'smooth'}); } };
}

function setupNav() {
  qsa('.category-bar button').forEach(b => {
    b.addEventListener('click', () => {
      state.currentCategory = (b.dataset.category || 'all').toLowerCase().trim();
      state.currentPage = 1;
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function updateNavActive() {
  qsa('.category-bar button').forEach(b =>
    b.classList.toggle('active', (b.dataset.category || '').toLowerCase().trim() === state.currentCategory)
  );
}

function setupSearch() {
  const searchInput = qs('#searchInput');
  const searchBtn = qs('#searchBtn');

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.toLowerCase();
    state.currentPage = 1;
    applyFilters();
  });

  searchBtn.addEventListener('click', () => {
    state.query = searchInput.value.toLowerCase();
    state.currentPage = 1;
    applyFilters();
  });

  // Allow Enter to search
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      state.query = searchInput.value.toLowerCase();
      state.currentPage = 1;
      applyFilters();
    }
  });
}

function init(){ setupNav(); setupSearch(); loadPosts(); }
init();
