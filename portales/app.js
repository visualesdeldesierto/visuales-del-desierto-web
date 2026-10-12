(() => {
  "use strict";
  const els = {
    intro: document.querySelector("#intro"), start: document.querySelector("#start-button"),
    retry: document.querySelector("#retry-button"),
    status: document.querySelector("#status-card"), statusText: document.querySelector("#status-text"),
    artwork: document.querySelector("#artwork-card"), scene: document.querySelector("#ar-scene"),
    target: document.querySelector("#portal-target"), plane: document.querySelector("#portal-plane"),
    video: document.querySelector("#portal-video")
  };
  let started = false;
  let mediaPrepared = false;
  let trackingWatchdog = null;
  let targetVisible = false;
  let playbackAttempt = 0;
  let playbackRetryTimer = null;
  let playbackPending = false;
  const maxPlaybackAttempts = 6;

  function setStatus(message, state = "info") {
    els.status.hidden = false;
    els.status.dataset.state = state;
    els.statusText.textContent = message;
  }

  function cameraErrorMessage(error) {
    const name = error?.name || "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") return "La cámara está bloqueada. Actívala en los permisos del navegador e inténtalo de nuevo.";
    if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No encontramos una cámara disponible en este dispositivo.";
    if (!navigator.mediaDevices?.getUserMedia) return "Abre este enlace en Safari o Chrome para permitir el uso de la cámara.";
    if (!window.isSecureContext && location.hostname !== "localhost") return "La cámara necesita una conexión HTTPS segura.";
    return "No pudimos iniciar la cámara. Revisa los permisos y vuelve a intentarlo.";
  }

  async function requestCameraPermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new DOMException("Camera API unavailable", "NotSupportedError");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    stream.getTracks().forEach(track => track.stop());
  }

  function prepareVideo() {
    if (mediaPrepared) return;
    els.video.muted = true;
    els.video.defaultMuted = true;
    els.video.playsInline = true;
    els.video.setAttribute("muted", "");
    els.video.setAttribute("playsinline", "");
    els.video.src = els.video.dataset.src;
    els.video.load();
    els.plane.setAttribute("material", "shader: flat; src: #portal-video; transparent: false");
    mediaPrepared = true;
  }

  function clearPlaybackRetry() {
    if (playbackRetryTimer === null) return;
    window.clearTimeout(playbackRetryTimer);
    playbackRetryTimer = null;
  }

  async function ensureVideoPlaying() {
    if (!targetVisible || playbackPending) return;
    playbackPending = true;
    prepareVideo();
    setStatus("Portal encontrado · cargando obra…");
    try {
      await els.video.play();
      if (!targetVisible) {
        els.video.pause();
        return;
      }
      playbackAttempt = 0;
      clearPlaybackRetry();
      els.artwork.hidden = false;
      setStatus("Portal encontrado");
    } catch {
      if (!targetVisible) return;
      playbackAttempt += 1;
      if (playbackAttempt > maxPlaybackAttempts) {
        setStatus("No pudimos iniciar la obra automáticamente. Desactiva el ahorro de datos e inténtalo de nuevo.", "error");
        return;
      }
      setStatus("Portal encontrado · iniciando obra…");
      const delay = Math.min(250 * (2 ** (playbackAttempt - 1)), 2000);
      clearPlaybackRetry();
      playbackRetryTimer = window.setTimeout(ensureVideoPlaying, delay);
    } finally {
      playbackPending = false;
    }
  }

  function playVideo() {
    targetVisible = true;
    playbackAttempt = 0;
    clearPlaybackRetry();
    void ensureVideoPlaying();
  }

  function pauseVideo() {
    targetVisible = false;
    clearPlaybackRetry();
    els.video.pause();
    els.artwork.hidden = true;
    if (started) setStatus("Buscando portal…");
  }

  function startTrackingWatchdog() {
    if (trackingWatchdog !== null) window.clearInterval(trackingWatchdog);
    trackingWatchdog = window.setInterval(() => {
      const targetIsVisible = els.target.object3D?.visible === true;
      if (started && !targetIsVisible && !els.video.paused) pauseVideo();
    }, 200);
  }

  async function startExperience() {
    els.start.disabled = true;
    els.retry.hidden = true;
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setStatus("La cámara necesita una conexión HTTPS segura.", "error");
      els.start.disabled = false;
      els.retry.hidden = false;
      return;
    }
    setStatus("Solicitando cámara…");
    try {
      await requestCameraPermission();
      await els.scene.systems["mindar-image-system"].start();
      started = true;
      startTrackingWatchdog();
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
  els.target.addEventListener("targetFound", playVideo);
  els.target.addEventListener("targetLost", pauseVideo);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseVideo();
  });
  els.video.addEventListener("waiting", () => {
    if (targetVisible) setStatus("Portal encontrado · cargando obra…");
  });
  els.video.addEventListener("canplay", () => {
    if (targetVisible && els.video.paused) void ensureVideoPlaying();
  });
  els.video.addEventListener("playing", () => {
    if (targetVisible) setStatus("Portal encontrado");
    else els.video.pause();
  });
  els.video.addEventListener("error", () => setStatus("El video del Portal 01 aún no está disponible.", "error"));
  els.scene.addEventListener("arError", event => {
    setStatus(cameraErrorMessage(event.detail?.error || event.detail), "error");
    els.retry.hidden = false;
  });
})();
