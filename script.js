const header = document.querySelector("[data-header]");
const parallaxLayer = document.querySelector("[data-parallax]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const updateChrome = () => {
  const offset = window.scrollY;
  header.classList.toggle("is-scrolled", offset > 24);

  if (parallaxLayer && !reduceMotion) {
    const intensity = isCoarsePointer ? 0.06 : 0.12;
    parallaxLayer.style.transform = `translate3d(0, ${offset * intensity}px, 0) scale(1.04)`;
  }
};

updateChrome();
window.addEventListener("scroll", updateChrome, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

document.querySelectorAll(".project-card, .principle-item, .domain-item").forEach((element, index) => {
  element.style.setProperty("--delay", `${Math.min(index * 90, 360)}ms`);
});

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
