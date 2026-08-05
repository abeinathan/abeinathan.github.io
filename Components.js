/* ═══════════════════════════════════════════════════════════
   ABEI NATHAN — FLUID INTERACTIVE ENGINE (components_new.js)
   Features:
   1. Dynamic Custom Dual-Cursor (Ring + Dot with LERP fluid inertia)
   2. Ultra-Fluid Spring Physics Dot Scatter Canvas
   3. Magnetic Button Hover (Proximity Attraction Physics)
   4. Weight-Hover Variable Font Fluid Morphing
   5. Ripple & Multi-Particle Burst Click Engine
   6. 3D Parallax Tilt Cards with Dynamic Lighting
   7. Text Pressure Fluid Character Scaling
   8. Line Sidebar Scroll Observer & Mobile Navigation Drawer
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // LERP Helper Function for Fluid Motion
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /* ── 1. FLUID CUSTOM DUAL-CURSOR WITH LERP INERTIA ──────── */
  function initFluidCursor() {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;

    var dot = document.createElement('div');
    dot.className = 'fluid-cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'fluid-cursor-ring';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mouse = { x: -100, y: -100 };
    var dotPos = { x: -100, y: -100 };
    var ringPos = { x: -100, y: -100 };

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    // Hover state expanding ring on interactive elements
    var interactiveSelectors = 'a, button, .click-effect, .feature-card, .flip-card, .magic-bento-card, .weight-hover';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      }
    });

    function renderCursor() {
      // Immediate dot placement, smooth trailing ring lerp
      dotPos.x = lerp(dotPos.x, mouse.x, 0.4);
      dotPos.y = lerp(dotPos.y, mouse.y, 0.4);

      ringPos.x = lerp(ringPos.x, mouse.x, 0.15);
      ringPos.y = lerp(ringPos.y, mouse.y, 0.15);

      dot.style.transform = 'translate3d(' + dotPos.x + 'px, ' + dotPos.y + 'px, 0)';
      ring.style.transform = 'translate3d(' + ringPos.x + 'px, ' + ringPos.y + 'px, 0)';

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  /* ── 2. ULTRA-FLUID SPRING PHYSICS DOT SCATTER ───────────── */
  function initFluidDotScatter(mount) {
    if (!mount) return;

    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    mount.appendChild(canvas);

    if (reduceMotion) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dots = [];
    var size = { w: 0, h: 0 };
    var mouse = { x: -9999, y: -9999, radius: 180, strength: 55 };

    function buildDots(w, h) {
      var step = 20;
      var cols = Math.floor(w / step);
      var rows = Math.floor(h / step);
      var padX = (w % step) / 2;
      var padY = (h % step) / 2;
      dots = [];

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var ax = padX + c * step + step / 2;
          var ay = padY + r * step + step / 2;
          dots.push({
            ax: ax, ay: ay,
            x: ax, y: ay,
            vx: 0, vy: 0,
            baseRadius: 1.5,
            radius: 1.5,
            targetRadius: 1.5
          });
        }
      }
    }

    function resize() {
      var rect = mount.getBoundingClientRect();
      size.w = rect.width;
      size.h = rect.height;
      canvas.width = size.w * dpr;
      canvas.height = size.h * dpr;
      canvas.style.width = size.w + 'px';
      canvas.style.height = size.h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots(size.w, size.h);
    }

    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', function (e) {
      var rect = mount.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    document.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    function render() {
      ctx.clearRect(0, 0, size.w, size.h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var dx = mouse.x - d.ax;
        var dy = mouse.y - d.ay;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Fluid spring repulsion
        if (dist < mouse.radius && dist > 0) {
          var force = (1 - dist / mouse.radius) * mouse.strength;
          var angle = Math.atan2(dy, dx);
          var tx = d.ax - Math.cos(angle) * force;
          var ty = d.ay - Math.sin(angle) * force;
          d.vx += (tx - d.x) * 0.12;
          d.vy += (ty - d.y) * 0.12;
          d.targetRadius = 1.5 + (1 - dist / mouse.radius) * 2.5;
        } else {
          d.vx += (d.ax - d.x) * 0.06;
          d.vy += (d.ay - d.y) * 0.06;
          d.targetRadius = d.baseRadius;
        }

        d.vx *= 0.85;
        d.vy *= 0.85;
        d.x += d.vx;
        d.y += d.vy;
        d.radius = lerp(d.radius, d.targetRadius, 0.15);

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);

        if (dist < mouse.radius) {
          var alpha = 0.25 + (1 - dist / mouse.radius) * 0.7;
          ctx.fillStyle = 'rgba(163, 230, 53, ' + alpha + ')'; // Fluid Lime
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        }
        ctx.fill();
      }

      requestAnimationFrame(render);
    }
    render();
  }

  /* ── 3. MAGNETIC BUTTON HOVER PHYSICS ───────────────────── */
  function initMagneticButtons() {
    if (reduceMotion) return;
    var elements = document.querySelectorAll('.btn-magnetic, .nav-item-link, .btn-primary, .btn-ghost');

    elements.forEach(function (el) {
      var bounding = el.getBoundingClientRect();

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - (rect.left + rect.width / 2);
        var y = e.clientY - (rect.top + rect.height / 2);

        el.style.transform = 'translate3d(' + (x * 0.25) + 'px, ' + (y * 0.25) + 'px, 0) scale(1.04)';
        el.style.transition = 'transform 0.1s ease-out';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate3d(0, 0, 0) scale(1)';
        el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      });
    });
  }

  /* ── 4. WEIGHT-HOVER VARIABLE FONT MORPHING ──────────────── */
  function initWeightHover() {
    if (reduceMotion) return;
    var targets = document.querySelectorAll('.weight-hover');

    targets.forEach(function (el) {
      el.style.transition = 'font-weight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease, letter-spacing 0.3s ease';

      el.addEventListener('mouseenter', function () {
        this.style.fontWeight = '800';
        this.style.letterSpacing = '0.02em';
      });

      el.addEventListener('mouseleave', function () {
        this.style.fontWeight = '';
        this.style.letterSpacing = '';
      });
    });
  }

  /* ── 5. RIPPLE & MULTI-PARTICLE BURST CLICK ───────────────── */
  function initFluidClickEffects() {
    if (reduceMotion) return;

    document.addEventListener('click', function (e) {
      var target = e.target.closest('.click-effect, a, button, .feature-card, .flip-card');
      if (!target) return;

      var x = e.clientX;
      var y = e.clientY;

      // Particle explosion
      for (var i = 0; i < 10; i++) {
        var p = document.createElement('div');
        p.className = 'fluid-particle';
        document.body.appendChild(p);

        var angle = (Math.PI * 2 / 10) * i + (Math.random() * 0.5 - 0.25);
        var speed = 35 + Math.random() * 45;
        var tx = Math.cos(angle) * speed;
        var ty = Math.sin(angle) * speed;

        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');

        setTimeout((function (el) {
          return function () { el.remove(); };
        })(p), 550);
      }
    });
  }

  /* ── 6. 3D PARALLAX TILT CARDS ───────────────────────────── */
  function init3DParallaxCards() {
    if (reduceMotion) return;
    var cards = document.querySelectorAll('.feature-card, .magic-bento-card, .profile-card-3d');

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = (y - centerY) / 15;
        var rotateY = (centerX - x) / 15;

        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)';
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  /* ── 7. TEXT PRESSURE FLUID MORPHING ─────────────────────── */
  function initTextPressure(mount, text) {
    if (!mount) return;
    var h1 = document.createElement('h1');
    h1.className = 'text-pressure-title weight-hover';
    var chars = text.split('');
    var spans = chars.map(function (ch) {
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      return span;
    });
    spans.forEach(function (s) { h1.appendChild(s); });
    mount.appendChild(h1);

    if (reduceMotion) return;

    var cursor = { x: 0, y: 0 };
    window.addEventListener('mousemove', function (e) {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    });

    function animate() {
      spans.forEach(function (span) {
        var r = span.getBoundingClientRect();
        var center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        var d = Math.hypot(cursor.x - center.x, cursor.y - center.y);
        var wght = Math.max(300, Math.min(900, 900 - d * 1.5));
        span.style.fontWeight = Math.round(wght);
      });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ── 8. PROFILE CARD MOUNT ───────────────────────────────── */
  function initProfileCard(mount) {
    if (!mount) return;
    mount.innerHTML =
      '<div class="profile-card-3d">' +
        '<div class="profile-avatar-wrap">' +
          '<div class="profile-avatar-ring"></div>' +
          '<img src="data:image/svg+xml;utf8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">' +
            '<rect width="600" height="600" fill="#0b0d14"/>' +
            '<circle cx="300" cy="270" r="140" fill="#1e2436"/>' +
            '<text x="300" y="315" font-family="Syne, sans-serif" font-size="130" font-weight="800" fill="#a3e635" text-anchor="middle">AN</text>' +
            '</svg>'
          ) + '" alt="Abei Nathan S K" class="profile-avatar-img">' +
        '</div>' +
        '<div class="text-center space-y-1">' +
          '<h3 class="text-xl font-bold font-syne text-white weight-hover">Abei Nathan S K</h3>' +
          '<p class="text-xs text-slate-400 font-geist">Data Analyst &amp; MBA Candidate</p>' +
          '<div class="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-semibold">' +
            '<span class="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span> Open to Opportunities' +
          '</div>' +
        '</div>' +
        '<a href="mailto:skabeinathan@gmail.com" class="mt-6 w-full inline-flex justify-center items-center py-2.5 rounded-full bg-lime-400 text-black font-bold text-xs hover:bg-lime-300 transition-all click-effect">' +
          'Email Me Direct' +
        '</a>' +
      '</div>';
  }

  /* ── INIT ON DOM READY ──────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initFluidCursor();
    initFluidDotScatter(document.getElementById('dotFieldMount'));
    initMagneticButtons();
    initWeightHover();
    initFluidClickEffects();
    init3DParallaxCards();
    initProfileCard(document.getElementById('profileCardMount'));
    initTextPressure(document.getElementById('textPressureMount'), 'DATA · STRATEGY · IMPACT');

    // Mobile Navbar Menu Toggle
    var menuBtn = document.getElementById('mobileMenuBtn');
    var mobileDropdown = document.getElementById('mobileDropdown');
    if (menuBtn && mobileDropdown) {
      menuBtn.addEventListener('click', function () {
        mobileDropdown.classList.toggle('hidden');
      });
      mobileDropdown.querySelectorAll('a').forEach(function (l) {
        l.addEventListener('click', function () { mobileDropdown.classList.add('hidden'); });
      });
    }

    // Flip Card Click Handler
    document.querySelectorAll('.flip-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (!e.target.closest('a')) {
          card.classList.toggle('flipped');
        }
      });
    });
  });

})();
