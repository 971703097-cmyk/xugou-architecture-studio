(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const id = Number.parseInt(params.get("id") || "0", 10);

  function pairText(value) {
    if (!value) return "";
    if (typeof value === "string") return `<span class="en">${value}</span>`;
    return `${value.en ? `<span class="en">${value.en}</span>` : ""}${value.cn ? `<span class="cn">${value.cn}</span>` : ""}`;
  }

  function imageItem(item) {
    if (!item) return { src: "", alt: "" };
    if (typeof item === "string") return { src: item, alt: "" };
    return item;
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.14 });
    items.forEach((item) => observer.observe(item));
  }

  function initNav() {
    const nav = document.getElementById("monoNav");
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      nav.classList.toggle("is-hidden", y > lastY && y > 140);
      lastY = Math.max(y, 0);
    }, { passive: true });
  }

  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      const projects = data.projects || [];
      const project = projects[id] || projects[1] || projects[0];
      const currentId = Math.max(projects.indexOf(project), 0);
      const nextId = projects.length ? (currentId + 1) % projects.length : 0;
      const next = projects[nextId] || project;
      const gallery = project.gallery || [];
      const imageOne = imageItem(gallery[0] || project.imageFull);
      const imageTwo = imageItem(gallery[1] || project.imageFull);
      const imageThree = imageItem(gallery[2] || project.closingImage || project.imageFull);

      document.getElementById("studioName").textContent = data.studioName.en;
      document.getElementById("heroImage").src = project.imageFull;
      document.getElementById("heroImage").alt = project.title.en;
      document.getElementById("heroMeta").textContent = `${project.year} / ${project.location || project.category.en}`;
      document.getElementById("projectTitle").innerHTML = pairText(project.title);
      document.getElementById("projectLead").innerHTML = pairText(project.concept || project.detail || project.desc);
      document.getElementById("projectMeta").innerHTML = [
        ["Location", project.location || data.contact.location.en],
        ["Year", project.year],
        ["Scale", project.scale || "Spatial system"],
        ["Type", project.category.en]
      ].map(([label, value]) => `<div class="mono-meta-item"><span>${label}</span><strong>${value}</strong></div>`).join("");

      document.getElementById("imageOne").src = imageOne.src;
      document.getElementById("imageOne").alt = imageOne.alt || project.title.en;
      document.getElementById("chapterText").textContent = project.detail.en;
      document.getElementById("imageSpread").innerHTML = `
        <figure><img src="${imageTwo.src}" alt="${imageTwo.alt || project.title.en}" loading="lazy"></figure>
        <figure><img src="${imageThree.src}" alt="${imageThree.alt || project.title.en}" loading="lazy"></figure>
      `;
      document.getElementById("projectNotes").innerHTML = (project.technicalNotes || []).map((note) =>
        `<article class="mono-note"><span>${note.label}</span><p>${note.value}</p></article>`
      ).join("");
      document.getElementById("closingImage").src = project.closingImage || project.imageFull;
      document.getElementById("closingImage").alt = `${project.title.en} closing view`;

      const nextText = `Next Project: ${next.title.en}`;
      document.getElementById("nextProject").textContent = "Next";
      document.getElementById("nextProject").href = `index.html?id=${nextId}`;
      document.getElementById("nextProjectFooter").textContent = nextText;
      document.getElementById("nextProjectFooter").href = `index.html?id=${nextId}`;
      document.title = `${project.title.en} - Monograph`;

      initReveal();
      initNav();
    });
})();
