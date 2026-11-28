(() => {
  "use strict";

  const hero = document.getElementById("hero-title");
  if (!hero) return;

  const projects = [];
  const seen = new Set();

  document.querySelectorAll('h3 a[href*="/projects/"]').forEach(link => {
    const card = link.closest("article") || link.closest(".card");
    if (!card || seen.has(link.href)) return;

    const img = card.querySelector(".media img, img");
    if (!img) return;

    seen.add(link.href);
    projects.push({
      title: link.textContent.trim(),
      href: link.getAttribute("href"),
      description: card.querySelector("p")?.textContent.trim() || "",
      image: img.getAttribute("src"),
      alt: img.alt
    });
  });

  if (!projects.length) return;

  const showcase = document.createElement("section");
  showcase.className = "lg-showcase";
  showcase.setAttribute("aria-label", "Interactive project showcase");
  showcase.setAttribute("aria-roledescription", "carousel");

  const eyebrow = document.createElement("div");
  eyebrow.className = "lg-eyebrow";
  eyebrow.textContent = "Selected work / Project intelligence";
  showcase.append(eyebrow);

  const slides = projects.map((project, i) => {
    const slide = document.createElement("div");
    slide.className = "lg-slide";
    slide.hidden = i !== 0;
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-label", `${i + 1} of ${projects.length}`);

    const content = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.description;

    const link = document.createElement("a");
    link.href = project.href;
    link.className = "primary";
    link.textContent = "Explore case study";
    link.style.cssText = "display:inline-block;padding:12px 22px;margin-top:12px;text-decoration:none";

    content.append(heading, description, link);

    const art = document.createElement("div");
    art.className = "lg-art";

    const image = document.createElement("img");
    image.src = project.image;
    image.alt = project.alt;
    image.loading = "lazy";
    image.decoding = "async";

    art.append(image);
    slide.append(content, art);
    showcase.append(slide);
    return slide;
  });

  const controls = document.createElement("div");
  controls.className = "lg-controls";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "\u2190";
  previous.setAttribute("aria-label", "Previous project");

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "\u2192";
  next.setAttribute("aria-label", "Next project");

  const count = document.createElement("span");
  count.className = "lg-count";
  count.setAttribute("aria-live", "polite");

  controls.append(previous, count, next);
  showcase.append(controls);

  let active = 0;

  function show(index) {
    active = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.hidden = i !== active;
      slide.classList.remove("lg-enter");
    });

    slides[active].classList.add("lg-enter");

    count.textContent =
      `${String(active + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  }

  previous.addEventListener("click", () => show(active - 1));
  next.addEventListener("click", () => show(active + 1));

  showcase.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(active - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(active + 1);
    }
  });

  let startX = 0;
  let startY = 0;

  showcase.addEventListener("touchstart", event => {
    startX = event.changedTouches[0].clientX;
    startY = event.changedTouches[0].clientY;
  }, { passive: true });

  showcase.addEventListener("touchend", event => {
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      show(active + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  const heroSection = hero.closest("section");

  if (heroSection) {
    heroSection.insertAdjacentElement("afterend", showcase);
  } else {
    const main = document.querySelector("main");
    if (main) main.prepend(showcase);
  }

  show(0);
})();

/* Integrate the project showcase into the signature hero. */
(() => {
  const title = document.getElementById("hero-title");
  const showcase = document.querySelector(".lg-showcase");
  if (!title || !showcase) return;

  const hero = title.closest("section");
  if (!hero || hero.closest(".lg-hero-shell")) return;
  if (hero.contains(showcase)) return;

  const shell = document.createElement("div");
  shell.className = "lg-hero-shell";

  hero.before(shell);
  shell.append(hero, showcase);
})();


(() => {
  const showcase = document.querySelector(".lg-showcase");
  if (!showcase) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  showcase.addEventListener("pointermove", event => {
    if (reducedMotion.matches || event.pointerType !== "mouse") return;

    const bounds = showcase.getBoundingClientRect();

    showcase.style.setProperty(
      "--light-x",
      `${100 * (event.clientX - bounds.left) / bounds.width}%`
    );

    showcase.style.setProperty(
      "--light-y",
      `${100 * (event.clientY - bounds.top) / bounds.height}%`
    );
  });

  const count = showcase.querySelector(".lg-count");
  if (!count) return;

  const progress = document.createElement("div");
  progress.className = "lg-progress";
  progress.setAttribute("aria-hidden", "true");

  const fill = document.createElement("div");
  fill.className = "lg-progress-fill";

  progress.append(fill);
  count.after(progress);

  function updateProgress() {
    const values = count.textContent.match(/\d+/g);
    if (values && Number(values[1]) > 0) {
      fill.style.width =
        `${Number(values[0]) / Number(values[1]) * 100}%`;
    }
  }

  new MutationObserver(updateProgress).observe(count, {
    childList: true,
    characterData: true,
    subtree: true
  });

  updateProgress();
})();

