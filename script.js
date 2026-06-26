(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const hero = document.querySelector("[data-hero]");
  const canvas = document.getElementById("atmosphere");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const kineticText = document.querySelector("[data-kinetic-text] p");

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

  const revealItems = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (kineticText && !prefersReducedMotion) {
    const text = kineticText.textContent.trim();
    kineticText.textContent = "";

    const letters = [...text].map((character) => {
      const span = document.createElement("span");
      span.className = character === " " ? "kinetic-letter is-space" : "kinetic-letter";
      span.textContent = character === " " ? "\u00A0" : character;
      kineticText.appendChild(span);
      return span;
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
  let lastFrame = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };

  const createParticle = (index, centerX, centerY) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * Math.min(width, height) * 0.42;
    const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * width * 0.16;
    const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * height * 0.18;

    return {
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
      alpha: 0.28 + Math.random() * 0.38
    };
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = width * (width < 760 ? 0.58 : 0.68);
    const centerY = height * 0.5;
    const count = width < 700 ? 58 : Math.min(128, Math.floor(width / 10));
    pointer.x = pointer.tx = centerX;
    pointer.y = pointer.ty = centerY;
    particles = Array.from({ length: count }, (_, index) => createParticle(index, centerX, centerY));
  };

  const drawParticle = (particle, influence) => {
    const glow = particle.radius + influence * 2.2;
    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glow * 8);
    gradient.addColorStop(0, `rgba(${particle.hue}, ${particle.alpha * 0.55})`);
    gradient.addColorStop(0.35, `rgba(${particle.hue}, ${particle.alpha * 0.16})`);
    gradient.addColorStop(1, `rgba(${particle.hue}, 0)`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(particle.x, particle.y, glow * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${0.12 + influence * 0.12})`;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawConnections = () => {
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 92) continue;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 92) * 0.045})`;
        ctx.lineWidth = 1;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  };

  const draw = (time = 0) => {
    if (time - lastFrame < 16) {
      requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;
    ctx.clearRect(0, 0, width, height);

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    ctx.globalCompositeOperation = "lighter";
    particles.forEach((particle) => {
      const waveX = Math.cos(time * particle.drift + particle.phase) * 0.16;
      const waveY = Math.sin(time * particle.drift * 1.2 + particle.phase) * 0.14;
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const influence = Math.max(0, 1 - dist / 230);
      const force = pointer.active ? influence * 0.34 : influence * 0.08;

      particle.vx += waveX + (dx / dist) * force;
      particle.vy += waveY + (dy / dist) * force;
      particle.vx += (particle.originX - particle.x) * 0.0009;
      particle.vy += (particle.originY - particle.y) * 0.0009;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.x += particle.vx;
      particle.y += particle.vy;

      drawParticle(particle, influence);
    });

    ctx.globalCompositeOperation = "source-over";
    drawConnections();
    requestAnimationFrame(draw);
  };

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = event.clientX - rect.left;
    pointer.ty = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    pointer.tx = width * 0.68;
    pointer.ty = height * 0.5;
    pointer.active = false;
  });

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
})();
