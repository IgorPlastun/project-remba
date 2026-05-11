const head = document.querySelector(".scroll-head");
const sections = [...document.querySelectorAll("[data-head-x][data-head-y]")];

let activeIndex = -1;
let jumpTimer = 0;
let lastScrollY = window.scrollY;
let blowerTimer = 0;

function updateHeadPosition() {
  const midpoint = window.innerHeight * 0.5;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height * 0.5;
    const distance = Math.abs(center - midpoint);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  const target = sections[nearestIndex];
  head.style.left = `${target.dataset.headX}vw`;
  head.style.top = `${target.dataset.headY}vh`;

  const scrollDelta = Math.abs(window.scrollY - lastScrollY);
  const documentHeight = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const scrollProgress = window.scrollY / documentHeight;
  const pulse = (Math.sin(scrollProgress * Math.PI * 14) + 1) / 2;
  const velocityBoost = Math.min(scrollDelta / 80, 0.45);
  const extension = Math.min(1, 0.18 + pulse * 0.48 + velocityBoost);

  head.style.setProperty("--blower-extend", extension.toFixed(3));
  head.style.setProperty("--blower-tip-left", `${4 + 72 * extension}%`);
  lastScrollY = window.scrollY;
  window.clearTimeout(blowerTimer);
  blowerTimer = window.setTimeout(() => {
    head.style.setProperty("--blower-extend", "0.2");
    head.style.setProperty("--blower-tip-left", "18.4%");
  }, 180);

  if (nearestIndex !== activeIndex) {
    activeIndex = nearestIndex;
    head.classList.remove("is-jumping");
    window.clearTimeout(jumpTimer);
    requestAnimationFrame(() => head.classList.add("is-jumping"));
    jumpTimer = window.setTimeout(() => head.classList.remove("is-jumping"), 620);
  }
}

window.addEventListener("scroll", updateHeadPosition, { passive: true });
window.addEventListener("resize", updateHeadPosition);
updateHeadPosition();

const dossierPages = [...document.querySelectorAll("[data-dossier-page]")];
const dossierPrev = document.querySelector("[data-dossier-prev]");
const dossierNext = document.querySelector("[data-dossier-next]");
const dossierCount = document.querySelector("[data-dossier-count]");
const rescueScene = document.querySelector("[data-rescue-scene]");
const rescueCat = rescueScene?.querySelector(".rescue-scene__cat");
const finalSection = document.querySelector("#final");
const rocketLaunch = document.querySelector(".rocket-launch");
let dossierPageIndex = 0;
let dossierFlipTimer = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function updateCatFlight(progress) {
  if (!rescueScene) {
    return;
  }

  const catProgress = clamp((progress - 0.18) / 0.64);
  const points = [
    { x: 0, y: 0, rotate: -8, scale: 1, opacity: 1 },
    { x: -18, y: 11, rotate: -18, scale: 1.06, opacity: 1 },
    { x: -42, y: -9, rotate: -4, scale: 0.98, opacity: 1 },
    { x: -74, y: -22, rotate: 13, scale: 1.03, opacity: 1 },
    { x: -118, y: -34, rotate: -24, scale: 0.92, opacity: 0 },
  ];
  const segmentIndex = Math.min(points.length - 2, Math.floor(catProgress * (points.length - 1)));
  const localProgress = smoothStep((catProgress * (points.length - 1)) - segmentIndex);
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];

  if (rescueCat) {
    rescueScene.style.setProperty("--cat-x", `${mix(start.x, end.x, localProgress).toFixed(2)}vw`);
    rescueScene.style.setProperty("--cat-y", `${mix(start.y, end.y, localProgress).toFixed(2)}vh`);
    rescueScene.style.setProperty("--cat-rotate", `${mix(start.rotate, end.rotate, localProgress).toFixed(2)}deg`);
    rescueScene.style.setProperty("--cat-scale", mix(start.scale, end.scale, localProgress).toFixed(3));
    rescueScene.style.setProperty("--cat-opacity", mix(start.opacity, end.opacity, localProgress).toFixed(3));
  }
}

function updateDossierPage(nextIndex) {
  if (!dossierPages.length) {
    return;
  }

  const previousPage = dossierPages[dossierPageIndex];
  dossierPageIndex = (nextIndex + dossierPages.length) % dossierPages.length;

  window.clearTimeout(dossierFlipTimer);
  previousPage?.classList.add("is-leaving");
  previousPage?.classList.remove("is-active");

  dossierPages.forEach((page, index) => {
    if (index !== dossierPageIndex) {
      page.classList.remove("is-active");
    }
  });

  requestAnimationFrame(() => {
    dossierPages[dossierPageIndex].classList.add("is-active");
  });

  dossierFlipTimer = window.setTimeout(() => {
    previousPage?.classList.remove("is-leaving");
  }, 540);

  if (dossierCount) {
    dossierCount.textContent = `${dossierPageIndex + 1} / ${dossierPages.length}`;
  }
}

dossierPrev?.addEventListener("click", () => updateDossierPage(dossierPageIndex - 1));
dossierNext?.addEventListener("click", () => updateDossierPage(dossierPageIndex + 1));
updateDossierPage(0);

function updateRescueScene() {
  if (!rescueScene) {
    return;
  }

  const rect = rescueScene.getBoundingClientRect();
  const travel = window.innerHeight + rect.height;
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel));

  rescueScene.style.setProperty("--rescue-progress", progress.toFixed(3));
  rescueScene.classList.toggle("is-active", progress > 0.16);
  rescueScene.classList.toggle("is-dousing", progress > 0.34 && progress < 0.66);
  rescueScene.classList.toggle("is-doused", progress >= 0.66);
  rescueScene.classList.toggle("is-flying-away", progress >= 0.82);
  updateCatFlight(progress);

  head?.classList.toggle("is-rescue-active", progress > 0.16 && progress < 0.82);
  head?.classList.toggle("is-rescue-dousing", progress > 0.34 && progress < 0.66);
  head?.classList.toggle("is-rescue-doused", progress >= 0.66 && progress < 0.82);
  head?.classList.toggle("is-rescue-flying-away", progress >= 0.82 || progress <= 0.16);
}

window.addEventListener("scroll", updateRescueScene, { passive: true });
window.addEventListener("resize", updateRescueScene);
updateRescueScene();

function updateRocketLaunchVisibility() {
  if (!finalSection || !rocketLaunch || rocketLaunch.classList.contains("is-launched")) {
    return;
  }

  const rect = finalSection.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.18;
  rocketLaunch.classList.toggle("is-visible", isVisible);
}

rocketLaunch?.addEventListener("click", () => {
  rocketLaunch.classList.remove("is-visible");
  rocketLaunch.classList.add("is-launched");
});

window.addEventListener("scroll", updateRocketLaunchVisibility, { passive: true });
window.addEventListener("resize", updateRocketLaunchVisibility);
updateRocketLaunchVisibility();
