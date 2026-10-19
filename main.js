(() => {
  'use strict';
  const data = window.PORTFOLIO_CONTENT || {};
  const $ = (selector) => document.querySelector(selector);
  const menu = $('.menu-toggle');
  const nav = $('#site-nav');
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
    menu.setAttribute('aria-label', expanded ? 'Открыть меню' : 'Закрыть меню');
    nav.classList.toggle('is-open', !expanded);
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
  }));

  const shoots = Array.isArray(data.photoshoots) ? data.photoshoots : [];
  let activeShoot = 0;
  let layout = 'editorial';
  let lightboxImages = [];
  let lightboxIndex = 0;
  const lightbox = $('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('figcaption');

  function showLightbox(index) {
    if (!lightboxImages.length) return;
    lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
    const item = lightboxImages[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt || 'Фотография';
    lightboxCaption.textContent = item.caption || '';
    $('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    if (!lightbox.open) lightbox.showModal();
  }
  $('.lightbox-close').addEventListener('click', () => lightbox.close());
  $('.lightbox-prev').addEventListener('click', () => showLightbox(lightboxIndex - 1));
  $('.lightbox-next').addEventListener('click', () => showLightbox(lightboxIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.open) return;
    if (e.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
    if (e.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
  });

  function renderShoot() {
    const shoot = shoots[activeShoot];
    if (!shoot) return;
    $('#shoot-title').textContent = shoot.title || '';
    $('#shoot-description').textContent = shoot.description || '';
    $('#shoot-type').textContent = shoot.type || '';
    $('#shoot-year').textContent = shoot.year || '';
    $('#gallery-note').hidden = !shoot.demo;

    const tabs = $('#shoot-tabs');
    tabs.replaceChildren();
    shoots.forEach((s, index) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.role = 'tab';
      b.className = 'shoot-tab';
      const img = document.createElement('img');
      img.src = s.cover || s.photos?.find(p => p.src)?.src || '';
      img.alt = '';
      img.loading = 'lazy';
      const text = document.createElement('span');
      text.className = 'shoot-tab-caption';
      const number = document.createElement('span');
      number.textContent = s.number || String(index + 1).padStart(2, '0');
      const title = document.createElement('strong');
      title.textContent = s.title || 'Серия';
      text.append(number, title);
      b.append(img, text);
      b.setAttribute('aria-selected', String(index === activeShoot));
      b.tabIndex = index === activeShoot ? 0 : -1;
      b.addEventListener('click', () => { activeShoot = index; renderShoot(); });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          activeShoot = (index + (e.key === 'ArrowRight' ? 1 : -1) + shoots.length) % shoots.length;
          renderShoot();
          tabs.querySelector('[aria-selected="true"]')?.focus();
        }
      });
      tabs.append(b);
    });

    const gallery = $('#gallery');
    gallery.className = `gallery gallery-${layout} gallery-count-${(shoot.photos || []).filter(p => p.src).length}`;
    gallery.replaceChildren();
    lightboxImages = (shoot.photos || []).filter((p) => p.src);
    (shoot.photos || []).forEach((photo, i) => {
      const available = Boolean(photo.src);
      const tile = document.createElement(available ? 'button' : 'div');
      tile.className = `gallery-item ${available ? 'has-image' : 'placeholder'}`;
      if (available) {
        tile.type = 'button';
        tile.setAttribute('aria-label', `Открыть фотографию ${i + 1}: ${photo.caption || ''}`);
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.alt || `Фото ${i + 1}`;
        img.loading = 'lazy';
        tile.append(img);
        const index = (shoot.photos || []).filter(p => p.src).indexOf(photo);
        tile.addEventListener('click', () => {
          // Design-gallery clicks reuse the same modal; restore this shoot's image set first.
          lightboxImages = (shoot.photos || []).filter(p => p.src);
          showLightbox(index);
        });
        const caption = document.createElement('span');
        caption.className = 'frame-caption';
        caption.textContent = photo.caption || `${String(i + 1).padStart(2, '0')}`;
        tile.append(caption);
      } else {
        const marker = document.createElement('span'); marker.className = 'placeholder-mark'; marker.textContent = '+';
        const label = document.createElement('span'); label.className = 'placeholder-text';
        label.textContent = `ДОБАВИТЬ КАДР ${String(i + 1).padStart(2, '0')}`;
        tile.append(marker, label);
      }
      gallery.append(tile);
    });
  }
  if (shoots.length) renderShoot();
  else $('#shoot-title').textContent = 'Добавь фотосессии в js/content.js';
  document.querySelectorAll('.layout-button').forEach((button) => {
    button.addEventListener('click', () => {
      layout = button.dataset.layout;
      document.querySelectorAll('.layout-button').forEach((b) => {
        const current = b === button;
        b.setAttribute('aria-pressed', String(current));
        b.classList.toggle('active', current);
      });
      $('#gallery').className = `gallery gallery-${layout} gallery-count-${(shoots[activeShoot]?.photos || []).filter(p => p.src).length}`;
    });
  });


  // Graphic design: brand concepts, event posters, creative studies, one 3-format campaign. Assets stored locally.
  const designWorks = Array.isArray(data.designWorks) ? data.designWorks : [];
  const designGrid = $('#design-grid');
  function renderDesignWorks(filter = 'all') {
    if (!designGrid) return;
    designGrid.replaceChildren();
    designGrid.dataset.activeFilter = filter;
    const filtered = designWorks.filter(w => filter === 'all' || w.group === filter);
    // Each kind stays accurately labelled as portfolio work, not an implied commercial client.
    function designLabel(w) {
      return w.kind === 'poster' ? 'Авторская афиша' : w.kind === 'concept' ? 'Авторский графический концепт' : 'Неофициальный рекламный концепт';
    }
    function designCaption(w) {
      return w.campaign ? 'КОНЦЕПТ ВИЗУАЛЬНОЙ КАМПАНИИ' : designLabel(w).toUpperCase();
    }
    // Treat visual campaign pieces as one editorial case rather than unrelated posters.
    const renderedCampaigns = new Set();
    function openDesignArtwork(works, selectedWork) {
      lightboxImages = works.map(w => ({
        src: w.image,
        alt: `${designLabel(w)}: ${w.brand} — ${w.title}`,
        caption: `${w.brand} / ${w.title} · ${designCaption(w)}`
      }));
      showLightbox(works.indexOf(selectedWork));
    }
    filtered.forEach((work, index) => {
      if (work.campaign) {
        if (renderedCampaigns.has(work.campaign)) return;
        renderedCampaigns.add(work.campaign);
        const campaignWorks = filtered.filter(w => w.campaign === work.campaign);
        const feature = document.createElement('article');
        feature.className = 'design-campaign';
        feature.setAttribute('aria-label', 'После шести — кейс визуальной кампании, три формата');
        const heading = document.createElement('div');
        heading.className = 'design-campaign-heading';
        const intro = document.createElement('div');
        const eyebrow = document.createElement('span');
        eyebrow.className = 'micro design-campaign-eyebrow';
        eyebrow.textContent = 'FEATURED CAMPAIGN / 2026 / АВТОРСКИЙ КОНЦЕПТ';
        const title = document.createElement('h3');
        title.textContent = 'ПОСЛЕ ШЕСТИ';
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Одна идея — три носителя: входной билет, digital-анонс и программа вечера. Синий, лаймовый, типографика и музыкальные детали объединяют серию в систему.';
        intro.append(eyebrow, title, subtitle);
        const meta = document.createElement('div');
        meta.className = 'design-campaign-meta micro';
        meta.textContent = '03 ФОРМАТА / 01 ВИЗУАЛЬНАЯ СИСТЕМА';
        heading.append(intro, meta);
        const mosaic = document.createElement('div');
        mosaic.className = 'design-campaign-mosaic';
        campaignWorks.forEach((piece, j) => {
          const item = document.createElement('div');
          item.className = `design-campaign-piece ${j === 0 ? 'design-campaign-piece-wide' : ''}`;
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'design-campaign-view design-artwork';
          button.setAttribute('aria-label', `Открыть ${piece.campaignRole}: ${piece.title}`);
          const img = document.createElement('img');
          img.src = piece.image;
          img.alt = `${piece.campaignRole} — ${piece.title}`;
          img.loading = 'lazy';
          img.decoding = 'async';
          const expand = document.createElement('span');
          expand.className = 'design-expand';
          expand.setAttribute('aria-hidden', 'true');
          expand.textContent = '↗';
          button.append(img, expand);
          button.addEventListener('click', () => openDesignArtwork(filtered, piece));
          const caption = document.createElement('div');
          caption.className = 'design-campaign-piece-caption';
          const role = document.createElement('span');
          role.className = 'micro'; role.textContent = piece.campaignRole;
          const label = document.createElement('span'); label.textContent = piece.title;
          caption.append(role, label);
          item.append(button, caption);
          mosaic.append(item);
        });
        feature.append(heading, mosaic);
        designGrid.append(feature);
        return;
      }
      const article = document.createElement('article');
      article.className = 'design-item';
      const view = document.createElement('button');
      view.type = 'button'; view.className = 'design-artwork';
      const imageLabel = designLabel(work);
      view.setAttribute('aria-label', `Посмотреть ${imageLabel.toLowerCase()}: ${work.brand} — ${work.title}`);
      const img = document.createElement('img');
      img.src = work.image; img.alt = `${imageLabel}: ${work.brand} — ${work.title}`;
      img.loading = 'lazy'; img.decoding = 'async';
      const expand = document.createElement('span');
      expand.className = 'design-expand'; expand.setAttribute('aria-hidden', 'true'); expand.textContent = '↗';
      view.append(img, expand);
      view.addEventListener('click', () => openDesignArtwork(filtered, work));
      const info = document.createElement('div'); info.className = 'design-art-info';
      const left = document.createElement('div');
      const type = document.createElement('span'); type.className = 'micro design-type'; type.textContent = work.type || 'DESIGN';
      const title = document.createElement('h3'); title.textContent = work.brand || 'Рекламная концепция';
      const detail = document.createElement('p'); detail.textContent = work.title || '';
      left.append(type,title,detail);
      const number = document.createElement('span'); number.className = 'micro design-number'; number.textContent = work.number || `${index + 1}`;
      info.append(left,number);
      article.append(view,info);
      designGrid.append(article);
    });
    if (!filtered.length) {
      const empty = document.createElement('p'); empty.textContent = 'В этой категории пока нет работ.';
      designGrid.append(empty);
    }
  }
  renderDesignWorks();
  // Counters follow the content array, keeping the UI correct as new posters are added.
  document.querySelectorAll('.design-filter').forEach(button => {
    const filter = button.dataset.filter || 'all';
    const count = filter === 'all' ? designWorks.length : designWorks.filter(w => w.group === filter).length;
    const label = button.querySelector('span');
    if (label) label.textContent = String(count).padStart(2, '0');
  });
  document.querySelectorAll('.design-filter').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.design-filter').forEach(b => {
        const selected = b === button;
        b.classList.toggle('is-active', selected);
        b.setAttribute('aria-pressed', String(selected));
      });
      renderDesignWorks(button.dataset.filter || 'all');
    });
  });

  // YouTube Shorts: lightweight 9:16 preview cards. Embeds load only on user click.
  const videoGrid = $('#video-grid');
  (data.videos || []).forEach((video, index) => {
    if (!videoGrid) return;
    const article = document.createElement('article'); article.className = 'video-card';
    const frame = document.createElement('div'); frame.className = 'video-frame';
    const validId = /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId || '');
    const videoTitle = video.title || `Видеоработа ${String(index + 1).padStart(2,'0')}`;
    if (validId) {
      const play = document.createElement('button'); play.className = 'video-load'; play.type = 'button';
      play.setAttribute('aria-label', `Воспроизвести ${videoTitle}`);
      const preview = document.createElement('img');
      preview.className = 'video-poster';
      preview.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
      preview.alt = ''; preview.loading = 'lazy'; preview.decoding = 'async';
      // If YouTube blocks thumbnails, the dark CSS fallback still displays a play button.
      preview.addEventListener('error', () => preview.remove());
      const playCircle = document.createElement('span'); playCircle.className = 'video-play';
      playCircle.textContent = '▶'; playCircle.setAttribute('aria-hidden', 'true');
      const number = document.createElement('span'); number.className = 'video-ordinal micro';
      number.textContent = `SHORT / ${String(index + 1).padStart(2, '0')}`;
      const hint = document.createElement('span'); hint.className = 'video-cta';
      hint.textContent = 'СМОТРЕТЬ ВИДЕО ↗';
      play.append(preview, number, playCircle, hint);
      play.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&playsinline=1&rel=0`;
        iframe.title = videoTitle;
        iframe.loading = 'eager';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.setAttribute('allowfullscreen', '');
        frame.replaceChildren(iframe);
        frame.dataset.playing = 'true';
      });
      frame.append(play);
    } else {
      const placeholder = document.createElement('p'); placeholder.className = 'video-empty';
      placeholder.textContent = 'ВИДЕО БУДЕТ ДОБАВЛЕНО';
      frame.append(placeholder);
    }
    const info = document.createElement('div'); info.className = 'video-meta';
    const tag = document.createElement('small'); tag.textContent = video.category || 'VIDEO / SHORT';
    const title = document.createElement('h3'); title.textContent = videoTitle;
    info.append(tag, title);
    if (validId) {
      const original = document.createElement('a');
      original.href = `https://www.youtube.com/shorts/${video.youtubeId}`;
      original.target = '_blank'; original.rel = 'noopener noreferrer';
      original.className = 'video-external'; original.textContent = 'НА YOUTUBE ↗';
      original.setAttribute('aria-label', `Открыть ${videoTitle} на YouTube`);
      info.append(original);
    }
    article.append(frame, info);
    videoGrid.append(article);
  });

  const contacts = $('#contact-links');
  const links = [
    ['EMAIL ↗', data.email && `mailto:${data.email}`],
    ['TELEGRAM ↗', data.telegram],
    ['BEHANCE ↗', data.behance],
    ['INSTAGRAM ↗', data.instagram]
  ].filter((entry) => entry[1]);
  if (links.length) {
    links.forEach(([label, href]) => {
      const a = document.createElement('a'); a.href = href; a.textContent = label;
      if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      contacts.append(a);
    });
  } else {
    const pending = document.createElement('span'); pending.className = 'contact-pending';
    pending.textContent = 'КОНТАКТЫ МОЖНО ДОБАВИТЬ В JS/CONTENT.JS';
    contacts.append(pending);
  }
})();
