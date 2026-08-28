// ===== Rendering + interactivity for "Наша история" =====
(function () {
  const D = SITE_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ---------- Hero counters (live years/days/hours/minutes/seconds) ----------
  function calendarBreakdown(from, now) {
    let years = now.getFullYear() - from.getFullYear();
    let anniversary = new Date(from.getTime());
    anniversary.setFullYear(from.getFullYear() + years);
    if (anniversary > now) {
      years--;
      anniversary = new Date(from.getTime());
      anniversary.setFullYear(from.getFullYear() + years);
    }
    let ms = now - anniversary;
    const days = Math.floor(ms / 86400000); ms -= days * 86400000;
    const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
    const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
    const seconds = Math.floor(ms / 1000);
    return { years, days, hours, minutes, seconds };
  }

  function initCounters() {
    const togetherFrom = new Date(D.meta.metDateTime || D.meta.metDate);
    const marriedFrom = new Date(D.meta.weddingDateTime || D.meta.weddingDate);
    const pad = (n) => String(n).padStart(2, "0");
    let prevWedYears = null;

    function paint(prefix, from) {
      const b = calendarBreakdown(from, new Date());
      $("#" + prefix + "Years").textContent = b.years;
      $("#" + prefix + "Days").textContent = b.days;
      $("#" + prefix + "Hours").textContent = pad(b.hours);
      $("#" + prefix + "Min").textContent = pad(b.minutes);
      $("#" + prefix + "Sec").textContent = pad(b.seconds);
      return b;
    }
    function tick() {
      paint("tog", togetherFrom);
      const wed = paint("wed", marriedFrom);
      // Fire once, right when "лет женаты" first ticks over from 0 to 1.
      if (prevWedYears !== null && prevWedYears < 1 && wed.years >= 1) {
        triggerHeartPop();
      }
      prevWedYears = wed.years;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ---------- Heart-pop celebration (fires when "женаты" hits exactly 1 год) ----------
  function triggerHeartPop() {
    const anchor = document.querySelector('#wedYears')?.closest(".counter-group") || document.getElementById("heroCounters") || document.body;
    const rect = anchor.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const mainHeart = el("div", "heart-pop-main", "❤️");
    mainHeart.style.left = originX + "px";
    mainHeart.style.top = originY + "px";
    document.body.appendChild(mainHeart);
    setTimeout(() => mainHeart.remove(), 700);

    // Мини-сердечки + любимые смайлики жены (по частотным данным из раздела стикеров).
    const symbols = ["💖", "💗", "💓", "💞", "💕", "😍", "🥰", "💋", "🩷", "🥹", "😘", "🫠", "❤️"];
    const COUNT = 42;
    for (let i = 0; i < COUNT; i++) {
      const p = el("div", "burst-particle", symbols[Math.floor(Math.random() * symbols.length)]);
      const spread = 140 + Math.random() * 200;
      const xEnd = (Math.random() - 0.5) * 2 * spread;
      const xMid = xEnd * 0.55;
      const yUp = -(90 + Math.random() * 150);
      const yEnd = yUp + 220 + Math.random() * 220;
      const rot = Math.random() * 720 - 360;
      const dur = (1.1 + Math.random() * 0.9).toFixed(2) + "s";
      const delay = (Math.random() * 0.15).toFixed(2) + "s";

      p.style.left = originX + "px";
      p.style.top = originY + "px";
      p.style.fontSize = (1 + Math.random() * 1.3) + "rem";
      p.style.setProperty("--xm", xMid + "px");
      p.style.setProperty("--ym", yUp + "px");
      p.style.setProperty("--xe", xEnd + "px");
      p.style.setProperty("--ye", yEnd + "px");
      p.style.setProperty("--rot", rot + "deg");
      p.style.animationDuration = dur;
      p.style.animationDelay = delay;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2400);
    }
  }

  // ---------- Hero mini-game: catch the button 5 times ----------
  function initHeroGame() {
    const btn = $("#heroCta");
    const congrats = $("#heroCongrats");
    const continueBtn = $("#heroContinue");
    if (!btn || !congrats || !continueBtn) return;

    const teaseLabels = ["Не поймала 😏", "Ещё раз?", "Почти!", "Последний раз!"];
    let clicks = 0;

    function placeRandom(target) {
      target.style.position = "fixed";
      target.style.margin = "0";
      const w = target.offsetWidth || 220;
      const h = target.offsetHeight || 52;
      const maxX = Math.max(window.innerWidth - w - 32, 16);
      const maxY = Math.max(window.innerHeight - h - 32, 16);
      target.style.left = (16 + Math.random() * maxX) + "px";
      target.style.top = (16 + Math.random() * maxY) + "px";
    }

    btn.addEventListener("click", () => {
      clicks++;
      btn.classList.add("fading");
      setTimeout(() => {
        if (clicks < 5) {
          placeRandom(btn);
          btn.textContent = teaseLabels[clicks - 1];
          btn.classList.remove("fading");
        } else {
          btn.style.display = "none";
          congrats.classList.add("show");
        }
      }, 450);
    });

    continueBtn.addEventListener("click", () => {
      congrats.classList.remove("show");
      document.body.classList.remove("game-locked");
      setTimeout(() => {
        const intro = document.getElementById("intro");
        if (intro) intro.scrollIntoView({ behavior: "smooth" });
      }, 200);
    });
  }

  // ---------- Petals background (falling, swipeable by mouse/finger) ----------
  function initPetals() {
    const wrap = $("#petals");
    const colors = ["#f3c9d4", "#c9b6e4", "#a8c3a0"];
    const COUNT = 20;
    const petals = [];

    function spawn(p, initial) {
      p.size = 8 + Math.random() * 10;
      p.x = Math.random() * window.innerWidth;
      p.y = initial ? Math.random() * window.innerHeight - window.innerHeight : -20;
      p.vy = 0.35 + Math.random() * 0.5;
      p.vx = (Math.random() - 0.5) * 0.25;
      p.rot = Math.random() * 360;
      p.vrot = (Math.random() - 0.5) * 1.2;
      p.baseOpacity = 0.28 + Math.random() * 0.32;
      p.opacity = p.baseOpacity;
      p.el.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.el.style.width = p.size + "px";
      p.el.style.height = p.size + "px";
    }

    for (let i = 0; i < COUNT; i++) {
      const pEl = el("div", "petal");
      wrap.appendChild(pEl);
      const p = { el: pEl };
      spawn(p, true);
      petals.push(p);
    }

    // Track pointer (mouse or touch) globally — petals wrapper stays
    // pointer-events:none so this never blocks clicks or page scroll.
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false, lastMove: 0 };
    function updatePointer(x, y) {
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.lastMove = performance.now();
    }
    window.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (t) { pointer.x = t.clientX; pointer.y = t.clientY; }
    }, { passive: true });

    function tick() {
      const idle = performance.now() - pointer.lastMove > 120;
      const speed = idle ? 0 : Math.hypot(pointer.vx, pointer.vy);
      const hitRadius = 55;

      petals.forEach((p) => {
        if (speed > 4) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < hitRadius) {
            const push = (hitRadius - dist) / hitRadius;
            p.vx += pointer.vx * 0.18 * push;
            p.vy += pointer.vy * 0.18 * push;
            p.vrot += (Math.random() - 0.5) * 14 * push;
            p.opacity -= 0.05 * push;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vx *= 0.95;
        p.vrot *= 0.93;
        p.vy += (0.45 - p.vy) * 0.01; // ease back toward a gentle base fall speed

        if (p.y > window.innerHeight + 30 || p.opacity <= 0 || p.x < -50 || p.x > window.innerWidth + 50) {
          spawn(p, false);
        } else {
          p.opacity = Math.min(p.baseOpacity, p.opacity + 0.01);
        }

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
        p.el.style.opacity = p.opacity;
      });

      // damp pointer velocity so a held-still cursor stops pushing petals
      pointer.vx *= 0.8;
      pointer.vy *= 0.8;

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Intro ----------
  function renderIntro() {
    $("#introGreeting").textContent = D.intro.greeting;
    $("#introText").innerHTML = D.intro.paragraphs.map(p => `<p>${p}</p>`).join("");
    $("#meetingTitle").textContent = D.meeting.title;
    $("#meetingText").innerHTML = D.meeting.paragraphs.map(p => `<p>${p}</p>`).join("");
  }

  // ---------- Chapters (accordion) ----------
  function renderChapters() {
    const wrap = $("#chapters");
    D.chapters.forEach((ch, idx) => {
      const card = el("div", "chapter");
      const body = ch.sections.map(s => `
        <h4 class="chapter-sub">${s.heading}</h4>
        ${s.paragraphs.map(p => `<p>${p}</p>`).join("")}
      `).join("");
      card.innerHTML = `
        <div class="chapter-head">
          <div class="chapter-year">${ch.year}</div>
          <div class="chapter-heading">
            <h3>${ch.title}</h3>
            <p>${ch.teaser}</p>
          </div>
          <div class="chapter-arrow">▾</div>
        </div>
        <div class="chapter-body">${body}</div>
      `;
      const head = card.querySelector(".chapter-head");
      const bodyEl = card.querySelector(".chapter-body");
      head.addEventListener("click", () => {
        const isOpen = card.classList.contains("open");
        // close others for focus, but allow multiple open too — keep simple: toggle only this
        card.classList.toggle("open");
        bodyEl.style.maxHeight = card.classList.contains("open") ? bodyEl.scrollHeight + 60 + "px" : "0";
      });
      wrap.appendChild(card);
      if (idx === 0) {
        // open first chapter by default for a nicer first impression
      }
    });
  }

  // ---------- Timeline ----------
  function renderTimeline() {
    const wrap = $("#timelineWrap");
    D.timeline.forEach(item => {
      const t = el("div", "t-item");
      t.innerHTML = `
        <div class="t-date">${item.date}</div>
        <div class="t-event">${item.event}</div>
        <div class="t-why">${item.why}</div>
      `;
      t.addEventListener("click", () => t.classList.toggle("active"));
      wrap.appendChild(t);
    });
  }

  // ---------- Key events ----------
  function renderEvents() {
    const wrap = $("#eventsGrid");
    Object.values(D.keyEvents).forEach(ev => {
      const c = el("div", "event-card");
      c.innerHTML = `
        <div class="event-icon">${ev.icon}</div>
        <div class="event-date">${ev.date}</div>
        <h3>${ev.title}</h3>
        ${ev.paragraphs.map(p => `<p>${p}</p>`).join("")}
      `;
      wrap.appendChild(c);
    });
  }

  // ---------- Trips ----------
  function renderTrips() {
    const wrap = $("#tripsGrid");
    D.trips.forEach(t => {
      const c = el("div", "trip-card");
      c.innerHTML = `<h4>${t.name}</h4><div class="trip-dates">${t.dates}</div><p>${t.desc}</p>`;
      wrap.appendChild(c);
    });
  }

  // ---------- Gallery ----------
  function renderGallery() {
    const wrap = $("#galleryGrid");
    D.photos.forEach(p => {
      const item = el("div", "gallery-item");
      item.innerHTML = `
        <img src="assets/photos/${encodeURIComponent(p.file)}" alt="${p.title}" loading="lazy">
        <div class="gallery-caption">${p.date ? p.date + "<br>" : ""}${p.title}</div>
      `;
      item.addEventListener("click", () => openModal(p, "photos"));
      wrap.appendChild(item);
    });
  }

  function openModal(p, folder) {
    $("#modalImg").src = `assets/${folder}/${encodeURIComponent(p.file)}`;
    $("#modalDate").textContent = p.date || "";
    $("#modalDate").style.display = p.date ? "" : "none";
    $("#modalTitle").textContent = p.title || "";
    $("#modalStory").textContent = p.story || p.caption || "";
    $("#photoModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#photoModal").classList.remove("open");
    document.body.style.overflow = "";
  }

  // ---------- Quotes ----------
  let currentCategory = null;
  function renderQuoteTabs() {
    const wrap = $("#quoteTabs");
    const categories = Object.keys(D.quotes);
    currentCategory = categories[0];
    categories.forEach(cat => {
      const tab = el("div", "q-tab", cat);
      tab.addEventListener("click", () => {
        currentCategory = cat;
        $$(".q-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderQuoteCards();
      });
      wrap.appendChild(tab);
    });
    wrap.firstChild.classList.add("active");
  }
  function renderQuoteCards() {
    const wrap = $("#quoteCards");
    wrap.innerHTML = "";
    D.quotes[currentCategory].forEach(q => {
      const c = el("div", "quote-card");
      c.innerHTML = `<p class="qtext">«${q.text}»</p><p class="qmeta">— ${q.who}, ${q.date}</p>`;
      wrap.appendChild(c);
    });
  }

  // ---------- Stickers ----------
  function renderStickers() {
    $("#stickersIntro").textContent = D.stickers.intro;
    const wrap = $("#stickersBars");
    function col(title, data) {
      const max = data[0][1];
      const rows = data.map(([emoji, n]) => `
        <div class="bar-row">
          <span class="bar-emoji">${emoji}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(n / max) * 100}%"></div></div>
          <span class="bar-num">${n}</span>
        </div>
      `).join("");
      return `<div class="bar-col"><h4>${title}</h4>${rows}</div>`;
    }
    wrap.innerHTML =
      col("Мои текстовые эмодзи", D.stickers.myText) +
      col("Твои текстовые эмодзи", D.stickers.herText);

    const sig = $("#signatureGrid");
    D.stickers.signature.forEach(s => {
      const c = el("div", "sig-card");
      c.innerHTML = `<div class="sig-emoji">${s.emoji}</div><div class="sig-who">${s.who}</div><div class="sig-desc">${s.desc}</div>`;
      sig.appendChild(c);
    });
  }

  // ---------- Profiles ----------
  function renderProfiles() {
    const wrap = $("#profilesGrid");
    [D.profiles.gleb, D.profiles.wife].forEach(p => {
      const c = el("div", "profile-card");
      c.innerHTML = `
        <h3>${p.name}</h3>
        <div class="profile-birth">${p.birth}</div>
        <ul>${p.lines.map(l => `<li>${l}</li>`).join("")}</ul>
      `;
      wrap.appendChild(c);
    });
  }

  // ---------- Facts ----------
  function renderFacts() {
    const wrap = $("#factsGrid");
    D.facts.forEach(f => {
      const c = el("div", "fact-card");
      c.innerHTML = `<h4>${f.title}</h4><p>${f.text}</p>`;
      wrap.appendChild(c);
    });
  }

  // ---------- Dreams ----------
  function renderDreams() {
    $("#dreamsTitle").textContent = D.dreams.title;
    $("#dreamsText").innerHTML = D.dreams.paragraphs.map(p => `<p>${p}</p>`).join("");
  }

  // ---------- Letter ----------
  function renderLetter() {
    $("#letterTitle").textContent = D.finalMessage.title;
    $("#letterText").innerHTML = D.finalMessage.paragraphs.map(p => `<p>${p}</p>`).join("");
    $("#letterSignature").textContent = D.finalMessage.signature;
    $("#letterEnvelope").addEventListener("click", () => {
      $("#letterEnvelope").classList.add("hidden");
      $("#letterContent").classList.add("show");
      $("#letter").classList.add("open");
    });
  }

  // ---------- Videos ----------
  function renderVideos() {
    const list = window.VIDEOS || [];
    if (!list.length) return; // section + nav link stay hidden
    $("#videos").style.display = "";
    $("#navVideos").style.display = "";
    const wrap = $("#videoGrid");
    list.forEach(v => {
      const card = el("div", "video-card");
      card.innerHTML = `
        <video src="assets/videos/${encodeURIComponent(v.file)}" muted loop playsinline autoplay></video>
        <div class="video-play">▶</div>
        ${v.caption ? `<div class="video-caption">${v.caption}</div>` : ""}
      `;
      card.addEventListener("click", () => openVideoModal(v));
      wrap.appendChild(card);
    });
  }

  function openVideoModal(v) {
    const player = $("#videoModalPlayer");
    player.src = `assets/videos/${encodeURIComponent(v.file)}`;
    player.muted = false;
    player.currentTime = 0;
    $("#videoModal").classList.add("open");
    document.body.style.overflow = "hidden";
    player.play().catch(() => {});
  }
  function closeVideoModal() {
    const player = $("#videoModalPlayer");
    player.pause();
    player.removeAttribute("src");
    player.load();
    $("#videoModal").classList.remove("open");
    document.body.style.overflow = "";
  }

  // ---------- Special popup photos ----------
  function initSpecialPhotos() {
    const list = window.SPECIAL_PHOTOS || [];
    if (!list.length) return;
    const corners = ["tl", "tr", "bl", "br"];

    function showRandom() {
      const photo = list[Math.floor(Math.random() * list.length)];
      const corner = corners[Math.floor(Math.random() * corners.length)];
      const pop = el("div", `special-popup corner-${corner}`,
        `<img src="assets/special/${encodeURIComponent(photo.file)}" alt=""><div class="special-hint">✨</div>`);
      document.body.appendChild(pop);
      requestAnimationFrame(() => pop.classList.add("show"));

      let clicked = false;
      let hideTimer = setTimeout(hide, 4500);

      pop.addEventListener("click", () => {
        clicked = true;
        clearTimeout(hideTimer);
        openModal({ file: photo.file, title: "Особый кадр", story: photo.caption }, "special");
        hide();
      });

      function hide() {
        pop.classList.remove("show");
        setTimeout(() => pop.remove(), 600);
      }
    }

    function loop() {
      const delay = 15000 + Math.random() * 5000;
      setTimeout(() => { showRandom(); loop(); }, delay);
    }
    loop();
  }

  // ---------- Nav ----------
  function initNav() {
    $("#navToggle").addEventListener("click", () => $("#navLinks").classList.toggle("open"));
    $$("#navLinks a").forEach(a => a.addEventListener("click", () => $("#navLinks").classList.remove("open")));

    const sections = $$("section[id]");
    const links = $$("#navLinks a");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach(s => obs.observe(s));
  }

  function initModal() {
    $("#modalClose").addEventListener("click", closeModal);
    $("#photoModal").addEventListener("click", (e) => { if (e.target.id === "photoModal") closeModal(); });
    $("#videoModalClose").addEventListener("click", closeVideoModal);
    $("#videoModal").addEventListener("click", (e) => { if (e.target.id === "videoModal") closeVideoModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeVideoModal(); } });
  }

  function init() {
    initPetals();
    initCounters();
    initHeroGame();
    renderIntro();
    renderChapters();
    renderTimeline();
    renderEvents();
    renderTrips();
    renderGallery();
    renderVideos();
    renderQuoteTabs();
    renderQuoteCards();
    renderStickers();
    renderProfiles();
    renderFacts();
    renderDreams();
    renderLetter();
    initNav();
    initModal();
    initSpecialPhotos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
