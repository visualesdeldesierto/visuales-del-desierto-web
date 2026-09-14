(function (root) {
  "use strict";

  function parseVimeoUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
      const player = url.hostname === "player.vimeo.com";
      if (!player && !["vimeo.com", "www.vimeo.com"].includes(url.hostname)) return null;
      const match = url.pathname.match(player
        ? /^\/video\/(\d+)\/?$/
        : /^\/(?:manage\/videos\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
      if (!match) return null;
      const hash = url.searchParams.get("h") || match[2] || "";
      if (hash && !/^[a-zA-Z0-9]+$/.test(hash)) return null;
      const params = new URLSearchParams({ autoplay: "1", title: "0", byline: "0", portrait: "0" });
      if (hash) params.set("h", hash);
      return {
        id: match[1], hash,
        src: `https://player.vimeo.com/video/${match[1]}?${params}`,
        url: `https://vimeo.com/${match[1]}${hash ? `/${hash}` : ""}`
      };
    } catch { return null; }
  }

  function collectVideos(project) {
    const entries = [
      { url: project.vimeoUrl, orientation: project.vimeoOrientation },
      ...(Array.isArray(project.videos) ? project.videos : [])
    ];
    const videos = [];
    for (const entry of entries) {
      if (!entry) continue;
      const video = parseVimeoUrl(typeof entry === "string" ? entry : entry.url);
      if (!video) continue;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const orientation = entry.orientation === "horizontal" ? "horizontal" : "vertical";
      const existing = videos.find((item) => item.id === video.id);
      if (existing) {
        if (video.hash && !existing.hash) Object.assign(existing, video);
        if (title && !existing.title) existing.title = title;
        if (entry.orientation === "horizontal" || entry.orientation === "vertical") existing.orientation = orientation;
      } else videos.push({ ...video, title, orientation });
    }
    return videos;
  }

  function createGallery(dialog) {
    if (!dialog) return null;
    const frame = dialog.querySelector("[data-video-frame]");
    const stage = dialog.querySelector("[data-video-stage]");
    const fullscreen = dialog.querySelector("[data-video-fullscreen]");
    const title = dialog.querySelector("[data-video-title]");
    const caption = dialog.querySelector("[data-video-caption]");
    const nav = dialog.querySelector("[data-video-nav]");
    const counter = dialog.querySelector("[data-video-counter]");
    const pages = dialog.querySelector("[data-video-pages]");
    const swipe = dialog.querySelector("[data-video-swipe]");
    const external = dialog.querySelector("[data-video-external]");
    const close = dialog.querySelector("[data-video-close]");
    if (!frame || !stage || !fullscreen || !title || !caption || !nav || !counter || !pages || !swipe || !external || !close) return null;
    let videos = [], index = 0, projectTitle = "", opener = null, gesture = null;

    const doc = dialog.ownerDocument;
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
      if (!videos.length) return;
      index = (nextIndex + videos.length) % videos.length;
      const video = videos[index];
      const label = video.title || `Video ${index + 1}`;
      frame.title = `${projectTitle} — ${label}`;
      frame.src = video.src; // Replacing the source stops the previous video.
      stage.dataset.orientation = video.orientation;
      caption.textContent = label;
      counter.textContent = `${index + 1} de ${videos.length}`;
      external.href = video.url;
      external.setAttribute("aria-label", `Abrir ${label} en Vimeo (nueva pestaña)`);
      Array.from(pages.children).forEach((button, i) => {
        if (i === index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    close.addEventListener("click", () => dialog.close());
    fullscreen.addEventListener("click", toggleFullscreen);
    doc.addEventListener?.("fullscreenchange", updateFullscreenButton);
    doc.addEventListener?.("webkitfullscreenchange", updateFullscreenButton);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      frame.removeAttribute("src");
      dialog.classList.remove("is-expanded");
      updateFullscreenButton();
      videos = [];
      gesture = null;
      opener?.focus();
      opener = null;
    });
    dialog.addEventListener("keydown", (event) => {
      if (videos.length < 2 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        show(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    dialog.querySelector("[data-video-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-video-next]").addEventListener("click", () => show(index + 1));
    // Vimeo owns pointer gestures inside its iframe. Use a dedicated strip outside it.
    swipe.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      swipe.setPointerCapture(event.pointerId);
    });
    swipe.addEventListener("pointerup", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    });
    swipe.addEventListener("pointercancel", () => { gesture = null; });

    return {
      open(project, trigger) {
        videos = collectVideos(project);
        if (!videos.length) return;
        opener = trigger;
        projectTitle = project.title || "Proyecto";
        title.textContent = projectTitle;
        nav.hidden = videos.length < 2;
        swipe.hidden = videos.length < 2;
        pages.replaceChildren(...videos.map((video, i) => {
          const button = dialog.ownerDocument.createElement("button");
          button.type = "button";
          button.textContent = String(i + 1);
          button.setAttribute("aria-label", `Ver video ${i + 1}${video.title ? `: ${video.title}` : ""}`);
          button.addEventListener("click", () => show(i));
          return button;
        }));
        show(0);
        dialog.showModal();
        close.focus();
      }
    };
  }

  const api = { parseVimeoUrl, collectVideos, createGallery };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ProjectVideos = api;
})(typeof window !== "undefined" ? window : globalThis);
