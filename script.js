(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const hero = document.querySelector("[data-hero]");
  const canvas = document.getElementById("atmosphere");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const kineticText = document.querySelector("[data-kinetic-text] p");
  const projectGallery = document.querySelector("[data-project-gallery]");
  const videoDialog = document.querySelector("[data-video-dialog]");
  const videoGallery = window.ProjectVideos?.createGallery(videoDialog);
  const photoDialog = document.querySelector("[data-photo-dialog]");
  const photoGallery = window.ProjectPhotos?.createGallery(photoDialog);
  const contextDialog = document.querySelector("[data-context-dialog]");
  const contextClose = document.querySelector("[data-context-close]");
  const contextTitle = document.querySelector("[data-context-title]");
  const contextMeta = document.querySelector("[data-context-meta]");
  const contextDescription = document.querySelector("[data-context-description]");
  const contextDescriptionWrap = document.querySelector("[data-context-description-wrap]");
  const contextRole = document.querySelector("[data-context-role]");
  const contextRoleWrap = document.querySelector("[data-context-role-wrap]");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeMenu = () => {
    if (!menuToggle || !nav) return;
    menuToggle.classList.remove("is-open");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const toggleMenu = () => {
    if (!menuToggle || !nav) return;
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", toggleMenu);
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  let revealObserver = null;
  const observeRevealItems = (scope = document) => {
    const revealItems = [...scope.querySelectorAll(".reveal:not(.is-visible)")];
    if (revealObserver) {
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
  };

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
  }
  observeRevealItems();

  const loadSanityProjects = async () => {
    const config = window.SANITY_CONFIG;
    if (!projectGallery || !config?.projectId || !config?.dataset) return;

    const query = `*[_type == "project" && isPublic == true] | order(featured desc, order asc, year desc) [0...6] {
      _id,
      title,
      year,
      category,
      vimeoUrl,
      vimeoOrientation,
      videos[]{title, url, orientation},
      galleryImages[]{
        caption,
        alt,
        "url": asset->url
      },
      clientOrSpace,
      location,
      shortDescription,
      role,
      "heroPhoto": {
        "url": heroImage.asset->url,
        "alt": coalesce(heroImage.alt, title),
        "caption": title
      },
      "imageUrl": heroImage.asset->url,
      "imageAlt": coalesce(heroImage.alt, title)
    }`;
    const endpoint = `https://${config.projectId}.api.sanity.io/v${config.apiVersion || "2025-02-19"}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`Sanity responded with ${response.status}`);

      const { result: projects = [] } = await response.json();
      if (!projects.length) return;

      projectGallery.replaceChildren(...projects.map((project, index) => {
        const article = document.createElement("article");
        article.className = `project-piece reveal${index === 0 ? " project-piece-large" : ""}`;

        const media = document.createElement("div");
        media.className = `project-media ${project.imageUrl ? "project-media-image" : ["media-violet", "media-blue", "media-lines"][index % 3]}`;
        if (project.imageUrl) {
          media.style.backgroundImage = `linear-gradient(180deg, transparent 42%, rgba(0, 0, 0, 0.78)), url("${project.imageUrl}?auto=format&fit=crop&w=1600&q=85")`;
          media.setAttribute("role", "img");
          media.setAttribute("aria-label", project.imageAlt || project.title);
        } else {
          media.setAttribute("aria-hidden", "true");
        }

        const caption = document.createElement("div");
        caption.className = "project-caption";
        const meta = document.createElement("p");
        meta.textContent = [project.category, project.year].filter(Boolean).join(" / ");
        const title = document.createElement("h3");
        title.textContent = project.title;
        caption.append(meta, title);
        const actions = document.createElement("div");
        actions.className = "project-actions";

        const hasContext = project.shortDescription || project.role;
        if (hasContext) {
          const contextButton = document.createElement("button");
          contextButton.className = "project-video-button";
          contextButton.type = "button";
          contextButton.textContent = "Ver contexto";
          contextButton.addEventListener("click", () => {
            if (!contextDialog || !contextTitle || !contextMeta || !contextDescription || !contextRole) return;
            contextTitle.textContent = project.title;
            contextMeta.textContent = [project.category, project.year, project.clientOrSpace, project.location].filter(Boolean).join(" / ");
            contextDescription.textContent = project.shortDescription || "";
            contextRole.textContent = project.role || "";
            if (contextDescriptionWrap) contextDescriptionWrap.hidden = !project.shortDescription;
            if (contextRoleWrap) contextRoleWrap.hidden = !project.role;
            contextDialog.showModal();
          });
          actions.append(contextButton);
        }

        const videos = window.ProjectVideos?.collectVideos(project) || [];
        if (videos.length && videoGallery) {
          const playButton = document.createElement("button");
          playButton.className = "project-video-button";
          playButton.type = "button";
          playButton.textContent = videos.length === 1 ? "Ver video" : `Ver videos (${videos.length})`;
          playButton.setAttribute("aria-haspopup", "dialog");
          playButton.addEventListener("click", () => {
            videoGallery.open(project, playButton);
          });
          actions.append(playButton);
        }
        const photos = window.ProjectPhotos?.collectPhotos(project) || [];
        if (photos.length && photoGallery) {
          const photoButton = document.createElement("button");
          photoButton.className = "project-video-button";
          photoButton.type = "button";
          photoButton.textContent = photos.length === 1 ? "Ver foto" : "Ver fotos (" + photos.length + ")";
          photoButton.setAttribute("aria-haspopup", "dialog");
          photoButton.addEventListener("click", () => {
            photoGallery.open(project, photoButton);
          });
          actions.append(photoButton);
        }
        if (actions.childElementCount) caption.append(actions);
        article.append(media, caption);
        return article;
      }));

      observeRevealItems(projectGallery);
    } catch (error) {
      console.warn("No se pudieron cargar los proyectos de Sanity; se conserva el contenido de respaldo.", error);
    }
  };

  loadSanityProjects();

  const closeContext = () => contextDialog?.close();
  contextClose?.addEventListener("click", closeContext);
  contextDialog?.addEventListener("click", (event) => {
    if (event.target === contextDialog) closeContext();
  });

  if (kineticText && !prefersReducedMotion) {
    const text = kineticText.textContent.trim();
    kineticText.textContent = "";

    const words = text.split(" ");
    const letters = [];

    words.forEach((word, wordIndex) => {
      const wordWrap = document.createElement("span");
      wordWrap.className = "kinetic-word";

      [...word].forEach((character) => {
        const span = document.createElement("span");
        span.className = "kinetic-letter";
        span.textContent = character;
        wordWrap.appendChild(span);
        letters.push(span);
      });

      kineticText.appendChild(wordWrap);
      if (wordIndex < words.length - 1) {
        kineticText.appendChild(document.createTextNode(" "));
      }
    });

    const resetLetters = () => {
      letters.forEach((letter) => {
        letter.style.transform = "translate3d(0, 0, 0)";
        letter.style.opacity = "1";
      });
    };

    kineticText.addEventListener("pointermove", (event) => {
      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect();
        const letterX = rect.left + rect.width / 2;
        const letterY = rect.top + rect.height / 2;
        const dx = letterX - event.clientX;
        const dy = letterY - event.clientY;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 150);

        if (influence <= 0) {
          letter.style.transform = "translate3d(0, 0, 0)";
          letter.style.opacity = "1";
          return;
        }

        const angle = Math.atan2(dy, dx);
        const offset = influence * 22;
        const driftX = Math.cos(angle) * offset;
        const driftY = Math.sin(angle) * offset;
        letter.style.transform = `translate3d(${driftX}px, ${driftY}px, 0)`;
        letter.style.opacity = String(1 - influence * 0.16);
      });
    }, { passive: true });

    kineticText.addEventListener("pointerleave", resetLetters);
  }

  if (!ctx || !hero || prefersReducedMotion) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let synapses = [];
  let thoughtTrail = [];
  let lastFrame = 0;
  let lastPointerSample = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, active: false };

  const createParticle = (index, centerX, centerY) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * Math.min(width, height) * 0.42;
    const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * width * 0.16;
    const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * height * 0.18;

    return {
      id: index,
      x,
      y,
      originX: x,
      originY: y,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: 0.65 + Math.random() * 1.55,
      phase: Math.random() * Math.PI * 2,
      drift: 0.0018 + Math.random() * 0.0028,
      hue: index % 5 === 0 ? "0,159,227" : "150,0,255",
      alpha: 0.28 + Math.random() * 0.38,
      activation: 0
    };
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = width * (width < 760 ? 0.58 : 0.68);
    const centerY = height * 0.5;
    const count = width < 700 ? 54 : Math.min(144, Math.floor(width / 9));
    pointer.x = pointer.tx = centerX;
    pointer.y = pointer.ty = centerY;
    pointer.px = centerX;
    pointer.py = centerY;
    particles = Array.from({ length: count }, (_, index) => createParticle(index, centerX, centerY));
    synapses = [];
    thoughtTrail = [];
  };

  const drawParticle = (particle, influence) => {
    const energy = Math.max(influence, particle.activation);
    const glow = particle.radius + energy * 3.4;
    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glow * 8);
    gradient.addColorStop(0, "rgba(" + particle.hue + "," + (particle.alpha * (0.55 + energy * 0.32)) + ")");
    gradient.addColorStop(0.35, "rgba(" + particle.hue + "," + (particle.alpha * (0.16 + energy * 0.14)) + ")");
    gradient.addColorStop(1, "rgba(" + particle.hue + ",0)");

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(particle.x, particle.y, glow * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255," + (0.18 + energy * 0.72) + ")";
    ctx.arc(particle.x, particle.y, particle.radius + energy * 0.9, 0, Math.PI * 2);
    ctx.fill();
  };

  const addSynapse = (a, b, strength = 1) => {
    if (!a || !b || a === b) return;
    const from = a.id < b.id ? a : b;
    const to = a.id < b.id ? b : a;
    const existing = synapses.find((item) => item.from === from && item.to === to);
    if (existing) {
      existing.life = 1;
      existing.strength = Math.min(1, Math.max(existing.strength, strength));
      return;
    }
    synapses.push({
      from,
      to,
      life: 1,
      strength: Math.min(1, strength),
      phase: Math.random() * Math.PI * 2
    });
    const limit = width < 700 ? 80 : 190;
    if (synapses.length > limit) synapses.splice(0, synapses.length - limit);
  };

  const activateNetwork = (x, y, speed = 0) => {
    const radius = width < 700 ? 155 : 210;
    const nearby = particles
      .map((particle) => ({ particle, distance: Math.hypot(particle.x - x, particle.y - y) }))
      .filter((item) => item.distance < radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, width < 700 ? 5 : 8);

    nearby.forEach(({ particle, distance }, index) => {
      particle.activation = Math.max(particle.activation, 1 - distance / radius);
      if (index > 0) addSynapse(nearby[index - 1].particle, particle, 0.72 + speed * 0.04);
      if (index > 1 && index % 2 === 0) addSynapse(nearby[0].particle, particle, 0.58 + speed * 0.03);
    });

    const previous = thoughtTrail[thoughtTrail.length - 1];
    if (!previous || Math.hypot(previous.x - x, previous.y - y) > 15) {
      thoughtTrail.push({ x, y, life: 1 });
      if (thoughtTrail.length > 36) thoughtTrail.shift();
    }
  };

  const drawAmbientConnections = () => {
    const connectionDistance = width < 700 ? 78 : 102;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > connectionDistance) continue;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255," + ((1 - dist / connectionDistance) * 0.055) + ")";
        ctx.lineWidth = 0.75;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  };

  const drawSynapses = (time, frameScale) => {
    synapses = synapses.filter((synapse) => {
      synapse.life -= 0.0019 * frameScale;
      if (synapse.life <= 0) return false;

      const pulse = 0.5 + Math.sin(time * 0.006 + synapse.phase) * 0.5;
      const alpha = synapse.life * synapse.strength;
      const gradient = ctx.createLinearGradient(
        synapse.from.x,
        synapse.from.y,
        synapse.to.x,
        synapse.to.y
      );
      gradient.addColorStop(0, "rgba(150,0,255," + (alpha * 0.48) + ")");
      gradient.addColorStop(0.52, "rgba(255,255,255," + (alpha * (0.22 + pulse * 0.38)) + ")");
      gradient.addColorStop(1, "rgba(0,159,227," + (alpha * 0.48) + ")");

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.75 + alpha * 1.2;
      ctx.moveTo(synapse.from.x, synapse.from.y);
      ctx.lineTo(synapse.to.x, synapse.to.y);
      ctx.stroke();

      const progress = (time * 0.00022 + synapse.phase) % 1;
      const pulseX = synapse.from.x + (synapse.to.x - synapse.from.x) * progress;
      const pulseY = synapse.from.y + (synapse.to.y - synapse.from.y) * progress;
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255," + (alpha * 0.72) + ")";
      ctx.arc(pulseX, pulseY, 0.7 + pulse * 1.2, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  };

  const drawThoughtTrail = (frameScale) => {
    thoughtTrail.forEach((point) => { point.life -= 0.013 * frameScale; });
    thoughtTrail = thoughtTrail.filter((point) => point.life > 0);
    if (thoughtTrail.length < 2) return;

    ctx.beginPath();
    thoughtTrail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    const latestLife = thoughtTrail[thoughtTrail.length - 1].life;
    ctx.strokeStyle = "rgba(255,255,255," + (latestLife * 0.16) + ")";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawPointerConnections = () => {
    if (!pointer.active) return;
    const nearest = particles
      .map((particle) => ({ particle, distance: Math.hypot(particle.x - pointer.x, particle.y - pointer.y) }))
      .filter((item) => item.distance < 190)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    nearest.forEach(({ particle, distance }) => {
      const alpha = (1 - distance / 190) * 0.38;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
      ctx.lineWidth = 0.8;
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    });

    const pointerGlow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 42);
    pointerGlow.addColorStop(0, "rgba(255,255,255,0.26)");
    pointerGlow.addColorStop(0.24, "rgba(0,159,227,0.12)");
    pointerGlow.addColorStop(1, "rgba(150,0,255,0)");
    ctx.beginPath();
    ctx.fillStyle = pointerGlow;
    ctx.arc(pointer.x, pointer.y, 42, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (time = 0) => {
    if (time - lastFrame < 16) {
      requestAnimationFrame(draw);
      return;
    }
    const frameScale = Math.min(2.2, Math.max(0.7, (time - lastFrame) / 16.67));
    lastFrame = time;
    ctx.clearRect(0, 0, width, height);

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    particles.forEach((particle) => {
      const waveX = Math.cos(time * particle.drift + particle.phase) * 0.16;
      const waveY = Math.sin(time * particle.drift * 1.2 + particle.phase) * 0.14;
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - dist / 230);
      const force = pointer.active ? influence * 0.075 : influence * 0.018;

      particle.vx += waveX - (dx / dist) * force + (dy / dist) * force * 0.34;
      particle.vy += waveY - (dy / dist) * force - (dx / dist) * force * 0.34;
      particle.vx += (particle.originX - particle.x) * 0.0009;
      particle.vy += (particle.originY - particle.y) * 0.0009;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.activation = Math.max(0, particle.activation - 0.008 * frameScale);
    });

    ctx.globalCompositeOperation = "lighter";
    drawAmbientConnections();
    drawSynapses(time, frameScale);
    drawThoughtTrail(frameScale);
    drawPointerConnections();
    particles.forEach((particle) => {
      const influence = Math.max(0, 1 - Math.hypot(particle.x - pointer.x, particle.y - pointer.y) / 230);
      drawParticle(particle, pointer.active ? influence : 0);
    });
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(draw);
  };

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = event.clientX - rect.left;
    pointer.ty = event.clientY - rect.top;
    pointer.active = true;
    const speed = Math.min(12, Math.hypot(pointer.tx - pointer.px, pointer.ty - pointer.py) / 7);
    pointer.px = pointer.tx;
    pointer.py = pointer.ty;
    if (event.timeStamp - lastPointerSample > 32) {
      activateNetwork(pointer.tx, pointer.ty, speed);
      lastPointerSample = event.timeStamp;
    }
  }, { passive: true });

  hero.addEventListener("pointerdown", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = event.clientX - rect.left;
    pointer.ty = event.clientY - rect.top;
    pointer.x = pointer.tx;
    pointer.y = pointer.ty;
    pointer.active = true;
    activateNetwork(pointer.x, pointer.y, 4);
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    pointer.tx = width * 0.68;
    pointer.ty = height * 0.5;
    pointer.active = false;
  });

  hero.addEventListener("pointerup", () => {
    if (window.matchMedia("(pointer: coarse)").matches) pointer.active = false;
  }, { passive: true });

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
})();
