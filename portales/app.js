(() => {
  "use strict";
  const els = {
    intro: document.querySelector("#intro"), start: document.querySelector("#start-button"),
    retry: document.querySelector("#retry-button"), play: document.querySelector("#play-button"),
    status: document.querySelector("#status-card"), statusText: document.querySelector("#status-text"),
    artwork: document.querySelector("#artwork-card"), scene: document.querySelector("#ar-scene"),
    target: document.querySelector("#portal-target"), plane: document.querySelector("#portal-plane"),
    video: document.querySelector("#portal-video")
  };
  let started = false;
  let mediaPrepared = false;

  function setStatus(message, state = "info") {
    els.status.hidden = false;
    els.status.dataset.state = state;
    els.statusText.textContent = message;
  }

  async function resourceExists(url) {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      return response.ok;
    } catch { return false; }
  }

  function cameraErrorMessage(error) {
    const name = error?.name || "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") return "La cámara está bloqueada. Actívala en los permisos del navegador e inténtalo de nuevo.";
    if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No encontramos una cámara disponible en este dispositivo.";
    if (!window.isSecureContext && location.hostname !== "localhost") return "La cámara necesita una conexión HTTPS segura.";
    return "No pudimos iniciar la cámara. Revisa los permisos y vuelve a intentarlo.";
  }

  function prepareVideo() {
    if (mediaPrepared) return;
    els.video.src = els.video.dataset.src;
    els.video.load();
    els.plane.setAttribute("material", "shader: flat; src: #portal-video; transparent: false");
    mediaPrepared = true;
  }

  async function playVideo() {
    prepareVideo();
    setStatus("Portal encontrado · cargando obra…");
    try {
      await els.video.play();
      els.play.hidden = true;
      els.artwork.hidden = false;
      setStatus("Portal encontrado");
    } catch {
      setStatus("Portal encontrado · toca para reproducir");
      els.play.hidden = false;
    }
  }

  function pauseVideo() {
    els.video.pause();
    els.artwork.hidden = true;
    els.play.hidden = true;
    if (started) setStatus("Buscando portal…");
  }

  async function startExperience() {
    els.start.disabled = true;
    els.retry.hidden = true;
    setStatus("Preparando experiencia…");
    if (!(await resourceExists("./assets/targets/portal-01.mind"))) {
      setStatus("Falta compilar la imagen del Portal 01 (.mind).", "error");
      els.start.disabled = false;
      els.retry.hidden = false;
      return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setStatus("La cámara necesita una conexión HTTPS segura.", "error");
      els.start.disabled = false;
      els.retry.hidden = false;
      return;
    }
    setStatus("Solicitando cámara…");
    try {
      await els.scene.systems["mindar-image-system"].start();
      started = true;
      els.intro.hidden = true;
      setStatus("Buscando portal…");
    } catch (error) {
      setStatus(cameraErrorMessage(error), "error");
      els.start.disabled = false;
      els.retry.hidden = false;
    }
  }

  els.start.addEventListener("click", startExperience);
  els.retry.addEventListener("click", startExperience);
  els.play.addEventListener("click", playVideo);
  els.target.addEventListener("targetFound", playVideo);
  els.target.addEventListener("targetLost", pauseVideo);
  els.video.addEventListener("waiting", () => setStatus("Portal encontrado · cargando obra…"));
  els.video.addEventListener("playing", () => setStatus("Portal encontrado"));
  els.video.addEventListener("error", () => setStatus("El video del Portal 01 aún no está disponible.", "error"));
  els.scene.addEventListener("arError", event => {
    setStatus(cameraErrorMessage(event.detail?.error || event.detail), "error");
    els.retry.hidden = false;
  });
})();
