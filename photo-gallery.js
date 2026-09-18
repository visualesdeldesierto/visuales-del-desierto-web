(function (root) {
  "use strict";

  function parsePhoto(entry) {
    if (!entry || typeof entry.url !== "string") return null;
    try {
      const url = new URL(entry.url.trim());
      if (url.protocol !== "https:" || url.hostname !== "cdn.sanity.io" || !url.pathname.startsWith("/images/")) {
        return null;
      }
      const params = new URLSearchParams(url.search);
      params.set("auto", "format");
      params.set("fit", "max");
      params.set("w", "2400");
      params.set("q", "90");
      url.search = params.toString();
      return {
        src: url.toString(),
        alt: typeof entry.alt === "string" ? entry.alt.trim() : "",
        caption: typeof entry.caption === "string" ? entry.caption.trim() : ""
      };
    } catch {
      return null;
    }
  }

  function collectPhotos(project) {
    if (!project) return [];
    const entries = [
      project.heroPhoto,
      ...(Array.isArray(project.galleryImages) ? project.galleryImages : [])
    ];
    const photos = [];
    entries.map(parsePhoto).filter(Boolean).forEach((photo) => {
      if (!photos.some((existing) => existing.src === photo.src)) photos.push(photo);
    });
    return photos;
  }

  function createGallery(dialog) {
    if (!dialog) return null;
    const image = dialog.querySelector("[data-photo-image]");
    const stage = dialog.querySelector("[data-photo-stage]");
    const fullscreen = dialog.querySelector("[data-photo-fullscreen]");
    const title = dialog.querySelector("[data-photo-title]");
    const caption = dialog.querySelector("[data-photo-caption]");
    const nav = dialog.querySelector("[data-photo-nav]");
    const counter = dialog.querySelector("[data-photo-counter]");
    const pages = dialog.querySelector("[data-photo-pages]");
    const swipe = dialog.querySelector("[data-photo-swipe]");
    const close = dialog.querySelector("[data-photo-close]");
    const previous = dialog.querySelector("[data-photo-prev]");
    const next = dialog.querySelector("[data-photo-next]");
    if (!image || !stage || !fullscreen || !title || !caption || !nav || !counter || !pages || !swipe || !close || !previous || !next) {
      return null;
    }

    const doc = dialog.ownerDocument;
    let photos = [];
    let index = 0;
    let projectTitle = "";
    let opener = null;
    let gesture = null;

    const fullscreenElement = () => doc.fullscreenElement || doc.webkitFullscreenElement;
    const isExpanded = () => fullscreenElement() === stage || dialog.classList.contains("is-expanded");

    function updateFullscreenButton() {
      const expanded = isExpanded();
      fullscreen.textContent = expanded ? "Salir de pantalla completa" : "Pantalla completa";
      fullscreen.setAttribute("aria-expanded", String(expanded));
    }

    async function toggleFullscreen() {
      try {
        if (fullscreenElement() === stage) {
          const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
          if (exit) await exit.call(doc);
        } else if (stage.requestFullscreen || stage.webkitRequestFullscreen) {
          const enter = stage.requestFullscreen || stage.webkitRequestFullscreen;
          await enter.call(stage);
        } else {
          dialog.classList.toggle("is-expanded");
          updateFullscreenButton();
        }
      } catch {
        dialog.classList.toggle("is-expanded");
        updateFullscreenButton();
      }
    }

    function show(nextIndex) {
      if (!photos.length) return;
      index = (nextIndex + photos.length) % photos.length;
      const photo = photos[index];
      image.src = photo.src;
      image.alt = photo.alt || projectTitle + ", fotografía " + (index + 1);
      caption.textContent = photo.caption;
      caption.hidden = !photo.caption;
      counter.textContent = (index + 1) + " de " + photos.length;
      Array.from(pages.children).forEach((button, buttonIndex) => {
        if (buttonIndex === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    close.addEventListener("click", () => dialog.close());
    fullscreen.addEventListener("click", toggleFullscreen);
    previous.addEventListener("click", () => show(index - 1));
    next.addEventListener("click", () => show(index + 1));
    doc.addEventListener?.("fullscreenchange", updateFullscreenButton);
    doc.addEventListener?.("webkitfullscreenchange", updateFullscreenButton);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      image.removeAttribute("src");
      image.alt = "";
      photos = [];
      gesture = null;
      dialog.classList.remove("is-expanded");
      updateFullscreenButton();
      opener?.focus();
      opener = null;
    });
    dialog.addEventListener("keydown", (event) => {
      if (photos.length < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        show(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    });

    stage.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || event.target === fullscreen) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      stage.setPointerCapture?.(event.pointerId);
    });
    stage.addEventListener("pointerup", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (photos.length > 1 && Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        show(index + (dx < 0 ? 1 : -1));
      }
    });
    stage.addEventListener("pointercancel", () => { gesture = null; });

    return {
      open(project, trigger) {
        photos = collectPhotos(project);
        if (!photos.length) return;
        opener = trigger;
        projectTitle = project.title || "Proyecto";
        title.textContent = projectTitle;
        nav.hidden = photos.length < 2;
        swipe.hidden = photos.length < 2;
        pages.replaceChildren(...photos.map((photo, photoIndex) => {
          const button = doc.createElement("button");
          button.type = "button";
          button.textContent = String(photoIndex + 1);
          button.setAttribute("aria-label", "Ver fotografía " + (photoIndex + 1) + (photo.caption ? ": " + photo.caption : ""));
          button.addEventListener("click", () => show(photoIndex));
          return button;
        }));
        show(0);
        dialog.showModal();
        close.focus();
      }
    };
  }

  const api = { parsePhoto, collectPhotos, createGallery };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ProjectPhotos = api;
})(typeof window !== "undefined" ? window : globalThis);
