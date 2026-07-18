import { deck, scenes } from "./scenes.js";

const params = new URLSearchParams(window.location.search);
const requestedScene = Number.parseInt(params.get("scene") ?? "1", 10);
const recordMode = params.get("record") === "1";
const cleanMode = params.get("clean") === "1";
let sceneIndex = Math.min(Math.max(Number.isFinite(requestedScene) ? requestedScene - 1 : 0, 0), scenes.length - 1);

const elements = {
  brand: document.querySelector("#brand"),
  counter: document.querySelector("#counter"),
  kicker: document.querySelector("#kicker"),
  title: document.querySelector("#title"),
  body: document.querySelector("#body"),
  visual: document.querySelector("#visual"),
  progress: document.querySelector("#progress"),
  eyebrow: document.querySelector("#deck-eyebrow"),
  previous: document.querySelector("#previous"),
  next: document.querySelector("#next")
};

document.documentElement.style.setProperty("--accent", deck.accent ?? "#2563eb");
document.title = deck.title ?? "Voiceover Video";
elements.brand.textContent = deck.brand ?? "Your project";
elements.eyebrow.textContent = deck.eyebrow ?? "VOICEOVER VIDEO";
document.body.classList.toggle("record-mode", recordMode);
document.body.classList.toggle("clean-mode", cleanMode);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderSignal(visual) {
  const wrap = node("div", "signal-visual");
  wrap.append(node("span", "signal-label", visual.label ?? "Signal"));
  wrap.append(node("strong", "signal-value", visual.value ?? "01"));
  wrap.append(node("span", "signal-line"));
  return wrap;
}

function renderSteps(visual) {
  const wrap = node("ol", "steps-visual");
  for (const [index, item] of (visual.items ?? []).entries()) {
    const row = node("li");
    row.append(node("span", "step-number", String(index + 1).padStart(2, "0")));
    row.append(node("strong", "step-copy", item));
    wrap.append(row);
  }
  return wrap;
}

function renderComparison(visual) {
  const wrap = node("div", "comparison-visual");
  for (const side of [visual.left, visual.right].filter(Boolean)) {
    const card = node("div", "comparison-card");
    card.append(node("span", "comparison-label", side.label));
    card.append(node("strong", "comparison-value", side.value));
    wrap.append(card);
  }
  return wrap;
}

function renderQuote(visual) {
  const wrap = node("blockquote", "quote-visual");
  wrap.append(node("span", "quote-mark", "“"));
  wrap.append(node("p", "quote-copy", visual.text ?? ""));
  return wrap;
}

function renderImage(visual) {
  const figure = node("figure", "image-visual");
  const image = node("img");
  image.src = visual.src;
  image.alt = visual.alt ?? "";
  figure.append(image);
  if (visual.caption) figure.append(node("figcaption", "image-caption", visual.caption));
  return figure;
}

function renderFinish(visual) {
  const wrap = node("div", "finish-visual");
  wrap.append(node("span", "finish-check", "✓"));
  const list = node("div", "finish-tags");
  for (const item of visual.items ?? []) list.append(node("span", "finish-tag", item));
  wrap.append(list);
  return wrap;
}

function renderVisual(visual = {}) {
  const renderers = {
    signal: renderSignal,
    steps: renderSteps,
    comparison: renderComparison,
    quote: renderQuote,
    image: renderImage,
    finish: renderFinish
  };
  return (renderers[visual.type] ?? renderSignal)(visual);
}

function render() {
  const scene = scenes[sceneIndex];
  elements.kicker.textContent = scene.kicker;
  elements.title.textContent = scene.title;
  elements.body.textContent = scene.body;
  elements.counter.textContent = `${String(sceneIndex + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
  elements.progress.style.width = `${((sceneIndex + 1) / scenes.length) * 100}%`;
  elements.visual.replaceChildren(renderVisual(scene.visual));
  elements.previous.disabled = sceneIndex === 0;
  elements.next.disabled = sceneIndex === scenes.length - 1;
  window.__ACTIVE_SCENE__ = sceneIndex + 1;
}

function move(delta) {
  sceneIndex = Math.min(Math.max(sceneIndex + delta, 0), scenes.length - 1);
  render();
}

elements.previous.addEventListener("click", () => move(-1));
elements.next.addEventListener("click", () => move(1));
window.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " "].includes(event.key)) move(1);
  if (["ArrowLeft", "PageUp"].includes(event.key)) move(-1);
});

render();
const failedImages = [];
const imageReadiness = [...document.images].map((image) => {
  if (image.complete) {
    if (image.naturalWidth === 0) failedImages.push(image.currentSrc || image.src || "unknown image");
    return Promise.resolve();
  }
  return new Promise((resolveImage) => {
    image.addEventListener("load", resolveImage, { once: true });
    image.addEventListener(
      "error",
      () => {
        failedImages.push(image.currentSrc || image.src || "unknown image");
        resolveImage();
      },
      { once: true }
    );
  });
});
Promise.all([document.fonts.ready, ...imageReadiness]).then(() => {
  if (failedImages.length > 0) {
    window.__SLIDES_ERROR__ = `Failed to load: ${failedImages.join(", ")}`;
  } else {
    window.__SLIDES_READY__ = true;
  }
});
