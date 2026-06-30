/**
 * V15 — Spatial Narrative Engine
 * Full-viewport scenes · Cmd+K modes · Parallax · Scene progress
 */

(function () {
  "use strict";

  let __data = null;

  // ═══════════════════════════════════
  // Scene Reveal — IntersectionObserver
  // ═══════════════════════════════════
  function initSceneReveal() {
    const scenes = document.querySelectorAll(".scene");
    if (!scenes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Stagger children
            const children = entry.target.querySelectorAll(".card, .contact-grid > div, .sec-head, .about-body, .statement-lg");
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * 0.1}s`;
              child.style.opacity = "1";
              child.style.transform = "translateY(0)";
            });
          }
          // Update scene progress
          updateProgress(entry);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -80px 0px" }
    );

    scenes.forEach((el) => {
      // Set initial state for stagger children
      el.querySelectorAll(".card, .contact-grid > div").forEach((child) => {
        child.style.opacity = "0";
        child.style.transform = "translateY(30px)";
        child.style.transition = "opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out)";
      });
      io.observe(el);
    });
  }

  window.__initReveal = initSceneReveal;

  // ═══════════════════════════════════
  // Scene Progress — Right-edge dots
  // ═══════════════════════════════════
  function initProgress(sceneList) {
    const container = document.getElementById("sceneProgress");
    if (!container || !sceneList) return;

    container.innerHTML = sceneList
      .map(
        (s) =>
          `<div class="scene-dot" data-scene="${s.id}" data-label="${s.label}" title="${s.label}"></div>`
      )
      .join("");

    // Click to scroll
    container.querySelectorAll(".scene-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const target = document.getElementById(dot.dataset.scene);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function updateProgress(entry) {
    const dots = document.querySelectorAll(".scene-dot");
    if (!dots.length) return;

    if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
      const sceneId = entry.target.dataset.scene;
      dots.forEach((dot) => {
        dot.classList.toggle("is-active", dot.dataset.scene === sceneId);
      });
    }
  }

  // ═══════════════════════════════════
  // Parallax
  // ═══════════════════════════════════
  function initParallax() {
    const layer = document.getElementById("heroParallax");
    if (!layer) return;

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            if (scrollY < window.innerHeight * 1.5) {
              layer.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // ═══════════════════════════════════
  // Header
  // ═══════════════════════════════════
  function initHeader() {
    const hd = document.getElementById("hd");
    if (!hd) return;
    window.addEventListener(
      "scroll",
      () => hd.classList.toggle("is-scrolled", window.scrollY > 10),
      { passive: true }
    );
  }

  // ═══════════════════════════════════
  // Design Intelligence Engine
  // ═══════════════════════════════════
  const Engine = {
    modes: {},
    init(data) {
      this.modes = data.modes || {};
      const saved = sessionStorage.getItem("studio-mode");
      if (saved && this.modes[saved]) this.apply(saved, true);
    },
    interpret(input) {
      const t = input.toLowerCase().trim();
      if (!t) return null;

      // Strip common phrases for better matching
      const cleaned = t
        .replace(/^(make it|make this|switch to|change to|go to|try|use|apply)\s*/i, "")
        .replace(/[\s._-]+/g, " ")
        .trim();

      for (const [key, mode] of Object.entries(this.modes)) {
        if (cleaned === key || t === key) return key;
        if (mode.keywords && mode.keywords.some((kw) => cleaned.includes(kw) || t.includes(kw)))
          return key;
        if (cleaned.includes(mode.en.toLowerCase()) || t.includes(mode.en.toLowerCase()))
          return key;
        if (mode.cn && (cleaned.includes(mode.cn) || t.includes(mode.cn))) return key;
      }
      return null;
    },
    apply(mode, silent) {
      if (!this.modes[mode]) return;
      document.body.dataset.mode = mode;
      sessionStorage.setItem("studio-mode", mode);
      updateModeIndicator(mode, __data);
    },
    getFiltered(query) {
      if (!query) return Object.entries(this.modes);
      const t = query.toLowerCase().trim();
      return Object.entries(this.modes).filter(([key, mode]) =>
        key.includes(t) ||
        mode.en.toLowerCase().includes(t) ||
        (mode.cn && mode.cn.includes(t)) ||
        mode.description.toLowerCase().includes(t) ||
        (mode.keywords && mode.keywords.some((kw) => kw.includes(t)))
      );
    },
  };

  // ═══════════════════════════════════
  // Mode Indicator
  // ═══════════════════════════════════
  function updateModeIndicator(mode, data) {
    const nameEl = document.getElementById("modeName");
    const indicator = document.getElementById("modeIndicator");
    if (nameEl && data && data.modes[mode]) {
      nameEl.textContent = data.modes[mode].en;
    }
    if (indicator) indicator.classList.add("is-visible");
  }

  window.__updateModeIndicator = updateModeIndicator;

  // ═══════════════════════════════════
  // Command Palette
  // ═══════════════════════════════════
  function initCommandPalette(data) {
    const overlay = document.getElementById("cmdOverlay");
    const input = document.getElementById("cmdInput");
    const results = document.getElementById("cmdResults");
    const trigger = document.getElementById("cmdTrigger");
    if (!overlay || !input || !results) return;

    let activeIndex = 0;

    function open() {
      overlay.classList.add("is-open");
      input.value = "";
      activeIndex = 0;
      render("");
      setTimeout(() => input.focus(), 50);
    }

    function close() {
      overlay.classList.remove("is-open");
    }

    function render(query) {
      const modes = Engine.getFiltered(query);
      const current = document.body.dataset.mode;

      if (!modes.length) {
        results.innerHTML = '<div class="cmd-empty">No matching modes. Try: minimal, editorial, compact, luxury, structured</div>';
        return;
      }

      results.innerHTML = modes
        .map(([key, mode], i) => {
          const isActive = i === activeIndex;
          const isCurrent = key === current;
          return `<div class="cmd-result${isActive ? " is-active" : ""}" data-mode="${key}" data-index="${i}">
            <div class="cmd-result-main">
              <span class="cmd-result-name">${mode.en}${mode.cn ? `<span style="font-weight:300;color:var(--g2);margin-left:6px;font-family:var(--font-cn)">${mode.cn}</span>` : ""}</span>
              <span class="cmd-result-desc">${mode.description}</span>
            </div>
            <span class="cmd-result-badge">${isCurrent ? "Active" : "Apply"}</span>
          </div>`;
        })
        .join("");

      results.querySelectorAll(".cmd-result").forEach((el) => {
        el.addEventListener("click", () => {
          Engine.apply(el.dataset.mode);
          close();
        });
      });
    }

    input.addEventListener("input", () => { activeIndex = 0; render(input.value); });

    input.addEventListener("keydown", (e) => {
      const modes = Engine.getFiltered(input.value);
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, modes.length - 1); render(input.value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(input.value); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (modes[activeIndex]) { Engine.apply(modes[activeIndex][0]); close(); }
        else { const m = Engine.interpret(input.value); if (m) { Engine.apply(m); close(); } }
      }
      else if (e.key === "Escape") close();
    });

    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    if (trigger) trigger.addEventListener("click", open);

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        overlay.classList.contains("is-open") ? close() : open();
      }
    });
  }

  window.__initCommandPalette = initCommandPalette;

  // ═══════════════════════════════════
  // AI Command Bar — Natural Language Input
  // ═══════════════════════════════════
  function initAiBar(data) {
    const input = document.getElementById("aiInput");
    const toast = document.getElementById("aiToast");
    if (!input) return;

    // Set placeholder from data
    if (data && data.aiPrompt) {
      input.placeholder = data.aiPrompt.en;
    }

    let toastTimer = null;

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;

        const mode = Engine.interpret(value);
        if (mode && __data && __data.modes[mode]) {
          Engine.apply(mode);
          const modeName = __data.modes[mode].en;
          showToast(`Mode → ${modeName}`);
          input.value = "";
        } else {
          showToast("No matching mode. Try: minimal, luxury, editorial...");
        }
      }
    });

    // Global shortcut: "/" to focus AI bar
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA" &&
        !document.getElementById("cmdOverlay")?.classList.contains("is-open")
      ) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  window.__initAiBar = initAiBar;

  // ═══════════════════════════════════
  // Index Renderer
  // ═══════════════════════════════════
  function renderIndex(data) {
    // BG
    const bg = document.getElementById("bgLayer");
    if (bg && data.bgLayer) bg.style.backgroundImage = `url(${data.bgLayer})`;

    // Logo
    document.getElementById("hdLogo").textContent = data.studioName.en;

    // Hero parallax
    const hp = document.getElementById("heroParallax");
    if (hp && data.heroImage) hp.style.backgroundImage = `url(${data.heroImage})`;

    // Hero text
    document.getElementById("heroH").innerHTML =
      `<span class="en">${data.tagline.en}</span><span class="cn">${data.tagline.cn}</span>`;
    document.getElementById("heroSub").innerHTML =
      `<span class="en">${data.heroSubtitle.en}</span><span class="cn">${data.heroSubtitle.cn}</span>`;

    // Opening statement
    document.getElementById("openingStatement").innerHTML =
      `<span class="en">${data.openingStatement.en}</span><span class="cn">${data.openingStatement.cn}</span>`;

    // Works header
    document.getElementById("worksHead").innerHTML =
      `<span class="en">${data.sections.works.en}</span><span class="cn">${data.sections.works.cn}</span>`;

    // Works grid
    const grid = document.getElementById("workGrid");
    data.projects.forEach((p, i) => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `project.html?id=${i}`;
      card.innerHTML =
        `<div class="card-img-wrap"><img class="card-img" src="${p.image}" alt="${p.title.en}" loading="lazy"></div>
         <div class="card-info">
           <div class="card-meta"><span class="card-cat">${p.category.en}</span><span class="card-year">${p.year}</span></div>
           <div class="card-title"><span class="en">${p.title.en}</span><span class="cn">${p.title.cn}</span></div>
           <div class="card-desc"><span class="en">${p.desc.en}</span><span class="cn">${p.desc.cn}</span></div>
         </div>`;
      grid.appendChild(card);
    });

    // Philosophy
    document.getElementById("philosophyStatement").innerHTML =
      `<span class="en">${data.philosophyStatement.en}</span><span class="cn">${data.philosophyStatement.cn}</span>`;

    // About
    document.getElementById("aboutHead").innerHTML =
      `<span class="en">${data.sections.about.en}</span><span class="cn">${data.sections.about.cn}</span>`;
    document.getElementById("aboutBody").innerHTML =
      `<p class="en">${data.aboutText.en}</p><p class="cn">${data.aboutText.cn}</p>`;

    // Contact
    document.getElementById("contactHead").innerHTML =
      `<span class="en">${data.sections.contact.en}</span><span class="cn">${data.sections.contact.cn}</span>`;

    const contacts = [
      { lEn: "Email", lCn: "\u90AE\u7BB1", vEn: `<a href="mailto:${data.contact.email}">${data.contact.email}</a>`, vCn: "" },
      { lEn: "Location", lCn: "\u5730\u70B9", vEn: data.contact.location.en, vCn: data.contact.location.cn },
      { lEn: "Social", lCn: "\u793E\u4EA4", vEn: "@studio", vCn: "Instagram / Behance" },
    ];
    document.getElementById("contactGrid").innerHTML = contacts
      .map((c) =>
        `<div><div class="contact-label">${c.lEn}<span class="cn-inline">${c.lCn}</span></div>
         <div class="contact-val"><span class="en">${c.vEn}</span>${c.vCn ? `<span class="cn">${c.vCn}</span>` : ""}</div></div>`
      )
      .join("");

    // Footer
    document.getElementById("ftLeft").textContent = `\u00A9 ${new Date().getFullYear()} ${data.studioName.en}`;
    document.getElementById("ftRight").textContent = data.contact.location.en;
  }

  // ═══════════════════════════════════
  // Boot
  // ═══════════════════════════════════
  function boot() {
    initHeader();
    initParallax();

    if (document.getElementById("workGrid")) {
      fetch("data.json")
        .then((r) => r.json())
        .then((data) => {
          __data = data;
          renderIndex(data);
          Engine.init(data);
          initCommandPalette(data);
          initAiBar(data);
          initProgress(data.scenes);
          initSceneReveal();
        });
    } else {
      initSceneReveal();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
