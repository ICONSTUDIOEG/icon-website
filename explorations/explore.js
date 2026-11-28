/* Explorations: loads posts.json, renders the list or one post from Markdown. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso, lang) => {
    const d = new Date(iso + 'T12:00:00Z');
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const loadPosts = () => fetch('posts.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('posts.json ' + r.status); return r.json(); })
    .then(list => list.filter(p => !p.draft).sort((a, b) => String(b.date).localeCompare(String(a.date))));

  const card = (p, feature) => `
    <a class="card${feature ? ' feature' : ''}" href="post.html?p=${encodeURIComponent(p.slug)}"${p.lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>
      <div class="media"><img src="${esc(p.cover)}" alt="" loading="${feature ? 'eager' : 'lazy'}" width="1280" height="720"><span class="play">Read &middot; ${esc(p.minutes || 3)} min</span></div>
      <div style="display:grid;gap:10px;min-width:0">
        <div class="meta"><span class="cat">${esc(p.category)}</span><span>${fmtDate(p.date, p.lang)}</span></div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
      </div>
    </a>`;

  /* ---------- List page ---------- */
  function renderList() {
    const grid = $('#grid'), filters = $('#filters');
    loadPosts().then(posts => {
      if (!posts.length) { grid.innerHTML = '<p class="empty">The first explorations are on their way.</p>'; return; }
      const cats = ['All', ...new Set(posts.map(p => p.category).filter(Boolean))];
      filters.innerHTML = cats.map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
      const draw = cat => {
        const shown = cat === 'All' ? posts : posts.filter(p => p.category === cat);
        grid.innerHTML = shown.map((p, i) => card(p, i === 0 && cat === 'All')).join('');
      };
      filters.addEventListener('click', e => {
        const b = e.target.closest('[data-cat]'); if (!b) return;
        filters.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        draw(b.dataset.cat);
      });
      draw('All');
    }).catch(() => { grid.innerHTML = '<p class="empty">Explorations could not load. Please refresh the page.</p>'; });
  }

  /* ---------- Post page ---------- */
  function vimeoEmbed(id) {
    return `<div class="embed"><iframe src="https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="Film"></iframe></div>`;
  }
  function youtubeEmbed(id) {
    return `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="Film"></iframe></div>`;
  }
  function renderPost() {
    const slug = new URLSearchParams(location.search).get('p') || '';
    const root = $('#post');
    const notFound = () => { root.innerHTML = '<div class="article-head"><a class="back" href="./">&larr; All explorations</a><h1>This exploration was not found.</h1><p class="byline">It may have moved. Browse all explorations instead.</p></div>'; document.title = 'Not found | ICON Studio Explorations'; };
    loadPosts().then(posts => {
      const post = posts.find(p => p.slug === slug);
      if (!post || !/^[a-z0-9-]+$/.test(slug)) return notFound();
      return fetch(`posts/${slug}.md`, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('md ' + r.status); return r.text(); }).then(md => {
        const ar = post.lang === 'ar';
        let html = window.DOMPurify.sanitize(window.marked.parse(md));
        // Embeds are added after sanitising, from digits or a strict id pattern only.
        html = html.replace(/<p>\[vimeo:(\d{5,12})\]<\/p>/g, (_, id) => vimeoEmbed(id))
                   .replace(/<p>\[youtube:([A-Za-z0-9_-]{6,20})\]<\/p>/g, (_, id) => youtubeEmbed(id));
        document.title = `${post.title} | ICON Studio Explorations`;
        const desc = document.querySelector('meta[name=description]'); if (desc) desc.setAttribute('content', post.excerpt || '');
        const url = location.href.split('#')[0];
        root.innerHTML = `
          <header class="article-head"${ar ? ' lang="ar" dir="rtl"' : ''}>
            <a class="back" href="./">&larr; All explorations</a>
            <div class="meta"><span class="cat">${esc(post.category)}</span><span>${fmtDate(post.date, post.lang)}</span><span>${esc(post.minutes || 3)} min read</span></div>
            <h1>${esc(post.title)}</h1>
            <p class="byline">${esc(post.author || 'ICON Studio')}</p>
          </header>
          <div class="cover"><img src="${esc(post.cover)}" alt="" width="1280" height="720"></div>
          <article class="prose"${ar ? ' lang="ar" dir="rtl"' : ''}>${html}</article>
          <div class="article-foot">
            <span>ICON Studio &middot; Explorations</span>
            <div class="share">
              <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">Share on LinkedIn</a>
              <a href="https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noopener">Share on X</a>
              <button type="button" id="copy-link">Copy link</button>
            </div>
          </div>`;
        const copy = $('#copy-link');
        copy.addEventListener('click', () => {
          const done = () => { copy.textContent = 'Link copied'; setTimeout(() => { copy.textContent = 'Copy link'; }, 2000); };
          if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy this link', url));
          else prompt('Copy this link', url);
        });
        const others = posts.filter(p => p.slug !== slug).slice(0, 3);
        if (others.length) $('#more').innerHTML = `<h2 class="section">More explorations</h2><div class="grid" style="padding-bottom:0">${others.map(p => card(p, false)).join('')}</div>`;
      });
    }).catch(notFound);
  }

  if ($('#grid')) renderList();
  if ($('#post')) renderPost();
})();
