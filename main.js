/* ═══════════════════════════════════════════════════════════════
   MAIN.JS — ETHEREAL PORTFOLIO
   Mehrshad Javadi · Cinematic scroll-driven experience
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* global Lenis */
gsap.registerPlugin(ScrollTrigger);

/* ─── State ─────────────────────────────────────────────────── */
const IS_MOBILE = () => window.innerWidth <= 768;
const IS_TOUCH  = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const mouse = { x: 0, y: 0, normX: 0, normY: 0 };

/* ═══════════════════════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════════ */
let lenis;

function initLenis() {
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/* ═══════════════════════════════════════════════════════════════
   2. THREE.JS PARTICLE SYSTEM
   ═══════════════════════════════════════════════════════════════ */
let scene, camera, renderer, points;
let posArr, velArr = [];
let scatterActive = false;
let particleOpacity = 0.4;
const PARTICLE_COUNT = IS_MOBILE() ? 60 : 180;

function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* Geometry */
  const geo     = new THREE.BufferGeometry();
  posArr        = new Float32Array(PARTICLE_COUNT * 3);
  const initPos = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - .5) * 130;
    const y = (Math.random() - .5) * 85;
    const z = (Math.random() - .5) * 45;

    posArr[i*3]   = initPos[i*3]   = x;
    posArr[i*3+1] = initPos[i*3+1] = y;
    posArr[i*3+2] = initPos[i*3+2] = z;

    velArr.push({
      dx: (Math.random() - .5) * .018,
      dy: Math.random() * .028 + .009,
      dz: (Math.random() - .5) * .010,
      sx: (Math.random() - .5) * .72,
      sy: (Math.random() - .5) * .72,
      sz: (Math.random() - .5) * .36,
    });
  }

  geo.setAttribute('position',        new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('initialPosition', new THREE.BufferAttribute(initPos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x4F8EF7,
    size: 1.2,
    transparent: true,
    opacity: particleOpacity,
    sizeAttenuation: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  points = new THREE.Points(geo, mat);
  scene.add(points);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  tickParticles();
}

function tickParticles() {
  requestAnimationFrame(tickParticles);
  if (!points) return;

  const pos   = points.geometry.attributes.position.array;
  const t     = Date.now() * .001;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const n = i * 3;
    const v = velArr[i];

    if (scatterActive) {
      pos[n]   += v.sx;
      pos[n+1] += v.sy;
      pos[n+2] += v.sz;
    } else {
      pos[n]   += v.dx + Math.sin(t * .25 + i * .4) * .004;
      pos[n+1] += v.dy;
      pos[n+2] += v.dz;

      /* Mouse parallax — opposite direction */
      pos[n]   -= mouse.normX * .012;
      pos[n+1] -= mouse.normY * .008;

      /* Wrap */
      if (pos[n+1] >  55) pos[n+1] = -55;
      if (pos[n]   >  75) pos[n]   = -75;
      if (pos[n]   < -75) pos[n]   =  75;
    }
  }

  points.geometry.attributes.position.needsUpdate = true;
  points.material.opacity = particleOpacity;
  renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════════════════════════
   3. CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════ */
function initCursor() {
  if (IS_TOUCH()) return;

  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let started = false;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouse.normX = (e.clientX / window.innerWidth  - .5) * 2;
    mouse.normY = (e.clientY / window.innerHeight - .5) * 2;

    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';

    if (!started) {
      /* Snap ring to cursor on first move — no slide-in from corner */
      ringX = mouseX;
      ringY = mouseY;
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
      started = true;
    }
  });

  (function animateRing() {
    requestAnimationFrame(animateRing);
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
  })();

  /* Hover expand — gold on clickables */
  document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width       = '56px';
      ring.style.height      = '56px';
      ring.style.borderColor = '#C9A84C';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width       = '36px';
      ring.style.height      = '36px';
      ring.style.borderColor = '#4F8EF7';
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   4. NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
function initNavigation() {
  const nav             = document.getElementById('siteNav');
  const hamburger       = document.getElementById('hamburger');
  const mobileMenu      = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  /* Scroll → frosted glass nav — driven by Lenis, not native scroll */
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('scrolled', scroll > 80);
  });

  /* Hamburger open */
  hamburger?.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  /* Mobile menu close */
  mobileMenuClose?.addEventListener('click', closeMobile);

  document.querySelectorAll('.mobile-nav-link').forEach(a =>
    a.addEventListener('click', closeMobile)
  );

  function closeMobile() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Active section highlight */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
      }
    });
  }, { threshold: 0.35 }).observe;

  /* Smooth scroll for all hash links */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target && lenis) lenis.scrollTo(target, { duration: 1.4 });
    });
  });

  /* Re-attach observer properly */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => io.observe(s));
}

/* ═══════════════════════════════════════════════════════════════
   5. HERO — ENTRY ANIMATION + STICKY SCROLL ZOOM
   ═══════════════════════════════════════════════════════════════ */
function initHero() {
  const heroLabel   = document.getElementById('heroLabel');
  const heroLine1   = document.getElementById('heroLine1');
  const heroLine2   = document.getElementById('heroLine2');
  const heroRule    = document.getElementById('heroRule');
  const heroBio     = document.getElementById('heroBio');
  const heroButtons = document.getElementById('heroButtons');
  const heroContent = document.getElementById('heroContent');
  const flashEl     = document.getElementById('transitionFlash');
  const scrollInd   = document.getElementById('scrollIndicator');

  /* ── Entry timeline ── */
  const tl = gsap.timeline({ delay: 0.3 });
  tl.to(heroLabel,   { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, 0.3)
    .to(heroLine1,   { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, 0.6)
    .to(heroLine2,   { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, 0.8)
    .to(heroRule,    { width: 80,          duration: .8,  ease: 'power3.out' }, 1.0)
    .to(heroBio,     { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, 1.2)
    .to(heroButtons, { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, 1.4);

  /* ── Video zoom — scrubbed over full wrapper scroll budget ── */
  gsap.to('.hero-video', {
    scale: 4,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-wrapper',
      start: 'top top',
      end: '+=150%',
      scrub: true,
    },
  });

  /* Overlay zooms in perfect sync with the video */
  gsap.to('.hero-overlay', {
    scale: 4,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-wrapper',
      start: 'top top',
      end: '+=150%',
      scrub: true,
    },
  });

  /* ── Content fades out in the first 50vh of scroll budget ── */
  gsap.to(heroContent, {
    opacity: 0,
    y: -60,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-wrapper',
      start: 'top top',
      end: '+=50%',
      scrub: true,
    },
  });

  /* ── Particle scatter driven by scroll progress ── */
  ScrollTrigger.create({
    trigger: '.hero-wrapper',
    start: 'top top',
    end: '+=150%',
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      particleOpacity = Math.max(0, 0.4 * (1 - p * 1.5));

      if (p > 0.30 && !scatterActive) {
        scatterActive = true;
      } else if (p <= 0.30 && scatterActive) {
        scatterActive = false;
        if (points) {
          const pos  = points.geometry.attributes.position.array;
          const init = points.geometry.attributes.initialPosition.array;
          for (let j = 0; j < PARTICLE_COUNT * 3; j++) {
            pos[j] += (init[j] - pos[j]) * 0.08;
          }
        }
      }
    },
  });

  /* ── Flash transition — fires at 85% of wrapper scroll ── */
  ScrollTrigger.create({
    trigger: '.hero-wrapper',
    start: '85% top',
    end: '90% top',
    once: true,
    onEnter: () => {
      if (!flashEl) return;
      gsap.fromTo(flashEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => gsap.to(flashEl, { opacity: 0, duration: 0.3, ease: 'power2.out' }),
        }
      );
    },
  });

  /* ── Hide scroll indicator on first scroll ── */
  if (scrollInd) {
    ScrollTrigger.create({
      trigger: '.hero-wrapper',
      start: '3% top',
      onEnter:     () => scrollInd.classList.add('hidden'),
      onLeaveBack: () => scrollInd.classList.remove('hidden'),
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   6. ABOUT — slide in + counter
   ═══════════════════════════════════════════════════════════════ */
function initAbout() {
  const left  = document.getElementById('aboutLeft');
  const right = document.getElementById('aboutRight');

  if (left) gsap.from(left, {
    x: -70, opacity: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: left, start: 'top 82%', toggleActions: 'play none none none' },
  });

  if (right) gsap.from(right, {
    x: 70, opacity: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: right, start: 'top 82%', toggleActions: 'play none none none' },
  });

  /* About section fades in cleanly after flash */
  gsap.from('.about-section', {
    opacity: 0,
    y: 80,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 85%',
      end: 'top 40%',
      scrub: true,
    },
  });

  /* Counting numbers */
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].val) + suffix; },
        });
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   7. EXPERIENCE — timeline entries slide in
   ═══════════════════════════════════════════════════════════════ */
function initExperience() {
  document.querySelectorAll('.timeline-entry').forEach(entry => {
    const dot = entry.querySelector('.timeline-dot');
    gsap.to(entry, {
      opacity: 1, x: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: {
        trigger: entry,
        start: 'top 83%',
        toggleActions: 'play none none none',
        onEnter: () => {
          if (!dot) return;
          dot.classList.add('pulse');
          setTimeout(() => dot.classList.remove('pulse'), 800);
        },
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   8. STACK — staggered tool cards
   ═══════════════════════════════════════════════════════════════ */
function initStack() {
  document.querySelectorAll('.tool-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
      delay: (i % 12) * 0.05,
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   9. WORK — project cards + education
   ═══════════════════════════════════════════════════════════════ */
function initWork() {
  document.querySelectorAll('.project-card').forEach((card, i) => {
    const targetOpacity = card.classList.contains('project-card--coming-soon') ? 0.45 : 1;

    gsap.to(card, {
      opacity: targetOpacity, y: 0, duration: 0.8, ease: 'power3.out',
      delay: (i % 2) * 0.1,
      scrollTrigger: {
        trigger: card,
        start: 'top 89%',
        toggleActions: 'play none none none',
      },
    });

    /* Clickable featured card */
    const href = card.dataset.href;
    if (href) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', e => {
        if (!e.target.closest('.card-link')) window.open(href, '_blank', 'noopener');
      });
    }
  });

  /* Education cards */
  document.querySelectorAll('.edu-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      delay: i * 0.12,
      scrollTrigger: {
        trigger: card,
        start: 'top 89%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   10. SECTION LABEL & HEADING REVEALS
   ═══════════════════════════════════════════════════════════════ */
function initSectionReveal() {
  document.querySelectorAll('.section-label').forEach(el => {
    if (el.closest('#hero')) return; /* Hero has its own timeline */
    gsap.from(el, {
      opacity: 0, y: 16, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
    });
  });

  document.querySelectorAll('.section-heading').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   11. PAGE LOAD
   ═══════════════════════════════════════════════════════════════ */
function initPageLoad() {
  const loader = document.getElementById('pageLoader');
  const reveal = () => {
    document.body.classList.add('loaded');
    loader?.classList.add('hidden');
  };
  if (document.readyState === 'complete') {
    setTimeout(reveal, 80);
  } else {
    window.addEventListener('load', () => setTimeout(reveal, 80));
  }
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
function boot() {
  initPageLoad();
  initLenis();
  initParticles();
  if (!IS_TOUCH()) initCursor();
  initNavigation();
  initHero();
  initAbout();
  initExperience();
  initStack();
  initWork();
  initSectionReveal();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
