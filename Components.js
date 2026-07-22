/* ═══════════════════════════════════════════════════════════
   React Bits components, ported to plain JS/DOM for a static site.
   Ported: DotField, LineSidebar, MagicBento, ProfileCard, TextPressure
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. DOTFIELD ───────────────────────────────────────── */
  function initDotField(mount, opts) {
    if (!mount) return;
    opts = opts || {};
    var dotRadius = opts.dotRadius || 1.6;
    var dotSpacing = opts.dotSpacing || 15;
    var cursorRadius = opts.cursorRadius || 180;
    var bulgeStrength = opts.bulgeStrength || 40;
    var glowRadius = opts.glowRadius || 160;
    var gradientFrom = opts.gradientFrom || 'rgba(26, 107, 255, 0.22)';
    var gradientTo = opts.gradientTo || 'rgba(255, 77, 77, 0.14)';
    var glowColor = opts.glowColor || '#1a6bff';

    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    mount.appendChild(canvas);

    if (reduceMotion) return; // keep it static/absent for reduced motion users

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    var glowId = 'dot-field-glow-' + Math.random().toString(36).slice(2, 9);
    svg.innerHTML =
      '<defs><radialGradient id="' + glowId + '">' +
      '<stop offset="0%" stop-color="' + glowColor + '"/>' +
      '<stop offset="100%" stop-color="transparent"/></radialGradient></defs>' +
      '<circle cx="-9999" cy="-9999" r="' + glowRadius + '" fill="url(#' + glowId + ')" style="opacity:0"></circle>';
    mount.appendChild(svg);
    var glowEl = svg.querySelector('circle');

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dots = [];
    var size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    var mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    var glowOpacity = 0, engagement = 0, frameCount = 0, rafId, resizeTimer;

    function buildDots(w, h) {
      var step = dotRadius + dotSpacing;
      var cols = Math.floor(w / step);
      var rows = Math.floor(h / step);
      var padX = (w % step) / 2;
      var padY = (h % step) / 2;
      dots = [];
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var ax = padX + col * step + step / 2;
          var ay = padY + row * step + step / 2;
          dots.push({ ax: ax, ay: ay, sx: ax, sy: ay });
        }
      }
    }

    function doResize() {
      var rect = mount.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { w: w, h: h, offsetX: rect.left + window.scrollX, offsetY: rect.top + window.scrollY };
      buildDots(w, h);
    }
    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function onMouseMove(e) {
      mouse.x = e.pageX - size.offsetX;
      mouse.y = e.pageY - size.offsetY;
    }

    var speedInterval = setInterval(function () {
      var dx = mouse.prevX - mouse.x, dy = mouse.prevY - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (dist - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x; mouse.prevY = mouse.y;
    }, 20);

    function tick() {
      frameCount++;
      var w = size.w, h = size.h, len = dots.length;
      var targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;

      if (glowEl) {
        glowEl.setAttribute('cx', mouse.x);
        glowEl.setAttribute('cy', mouse.y);
        glowEl.style.opacity = glowOpacity;
      }

      ctx.clearRect(0, 0, w, h);
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, gradientFrom);
      grad.addColorStop(1, gradientTo);
      ctx.fillStyle = grad;

      var crSq = cursorRadius * cursorRadius;
      var rad = dotRadius / 2;
      ctx.beginPath();
      for (var i = 0; i < len; i++) {
        var d = dots[i];
        var dx = mouse.x - d.ax, dy = mouse.y - d.ay;
        var distSq = dx * dx + dy * dy;
        if (distSq < crSq && engagement > 0.01) {
          var dist = Math.sqrt(distSq);
          var t = 1 - dist / cursorRadius;
          var push = t * t * bulgeStrength * engagement;
          var angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }
        ctx.moveTo(d.sx + rad, d.sy);
        ctx.arc(d.sx, d.sy, rad, 0, Math.PI * 2);
      }
      ctx.fill();
      rafId = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);
  }

  /* ── 2. LINESIDEBAR ────────────────────────────────────── */
  function initLineSidebar(mount, items) {
    if (!mount) return;
    var falloff = function (p) { return p * p * (3 - 2 * p); }; // smooth
    var proximityRadius = 90;

    var nav = document.createElement('nav');
    nav.className = 'line-sidebar line-sidebar--markers';
    var ul = document.createElement('ul');
    ul.className = 'line-sidebar__list';
    nav.appendChild(ul);
    mount.appendChild(nav);

    var lis = items.map(function (item, index) {
      var li = document.createElement('li');
      li.className = 'line-sidebar__item';
      li.innerHTML =
        '<span class="line-sidebar__marker" aria-hidden="true"></span>' +
        '<span class="line-sidebar__label">' +
        '<span class="line-sidebar__index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="line-sidebar__text">' + item.label + '</span></span>';
      li.style.setProperty('--effect', '0');
      li.addEventListener('click', function () {
        var target = document.querySelector(item.href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      ul.appendChild(li);
      return li;
    });

    var targets = items.map(function () { return 0; });
    var current = items.map(function () { return 0; });
    var activeIndex = 0;
    var rafId = null;

    function runFrame() {
      var moving = false;
      for (var i = 0; i < lis.length; i++) {
        var target = Math.max(targets[i] || 0, activeIndex === i ? 1 : 0);
        var cur = current[i];
        var next = cur + (target - cur) * 0.18;
        var settled = Math.abs(target - next) < 0.0015;
        var value = settled ? target : next;
        current[i] = value;
        lis[i].style.setProperty('--effect', value.toFixed(4));
        if (!settled) moving = true;
      }
      rafId = moving ? requestAnimationFrame(runFrame) : null;
    }
    function startLoop() { if (rafId == null) rafId = requestAnimationFrame(runFrame); }

    if (!reduceMotion) {
      ul.addEventListener('pointermove', function (e) {
        var rect = ul.getBoundingClientRect();
        var pointerY = e.clientY - rect.top;
        for (var i = 0; i < lis.length; i++) {
          var el = lis[i];
          var center = el.offsetTop + el.offsetHeight / 2;
          var distance = Math.abs(pointerY - center);
          targets[i] = falloff(Math.max(0, 1 - distance / proximityRadius));
        }
        startLoop();
      });
      ul.addEventListener('pointerleave', function () {
        targets = targets.map(function () { return 0; });
        startLoop();
      });
    }

    // sync active state with scroll position via IntersectionObserver
    var sections = items.map(function (item) { return document.querySelector(item.href); }).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = sections.indexOf(entry.target);
            if (idx !== -1) {
              activeIndex = idx;
              lis.forEach(function (li, i) { li.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
              startLoop();
            }
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { observer.observe(s); });
    }
  }

  /* ── 3. MAGIC BENTO (skills section) ──────────────────── */
  function initMagicBento(grid) {
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.magic-bento-card'));
    if (!cards.length) return;

    var spotlightRadius = 260;
    var particleCount = 8;
    var spotlight = null;

    if (!reduceMotion) {
      spotlight = document.createElement('div');
      spotlight.className = 'global-mb-spotlight';
      document.body.appendChild(spotlight);
    }

    cards.forEach(function (card) {
      var glow = card.getAttribute('data-glow') || '26, 107, 255';
      card.style.setProperty('--glow-color', glow);
      var particles = [];
      var particleTimers = [];
      var isHovered = false;

      function spawnParticles() {
        for (var i = 0; i < particleCount; i++) {
          (function (index) {
            var timer = setTimeout(function () {
              if (!isHovered) return;
              var rect = card.getBoundingClientRect();
              var p = document.createElement('div');
              p.className = 'mb-particle';
              p.style.left = (Math.random() * rect.width) + 'px';
              p.style.top = (Math.random() * rect.height) + 'px';
              p.style.background = 'rgba(' + glow + ', 1)';
              p.style.boxShadow = '0 0 6px rgba(' + glow + ', 0.6)';
              p.style.opacity = '0';
              p.style.transform = 'scale(0)';
              card.appendChild(p);
              particles.push(p);
              requestAnimationFrame(function () {
                p.style.opacity = '0.8';
                p.style.transform = 'translate(' + ((Math.random() - 0.5) * 50) + 'px,' + ((Math.random() - 0.5) * 50) + 'px) scale(1)';
              });
            }, index * 90);
            particleTimers.push(timer);
          })(i);
        }
      }
      function clearParticles() {
        particleTimers.forEach(clearTimeout);
        particleTimers = [];
        particles.forEach(function (p) {
          p.style.opacity = '0';
          p.style.transform += ' scale(0)';
          setTimeout(function () { p.remove(); }, 300);
        });
        particles = [];
      }

      card.addEventListener('mouseenter', function () {
        isHovered = true;
        if (!reduceMotion) spawnParticles();
      });
      card.addEventListener('mouseleave', function () {
        isHovered = false;
        clearParticles();
      });
      card.addEventListener('click', function (e) {
        if (reduceMotion) return;
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var maxDistance = Math.max(
          Math.hypot(x, y), Math.hypot(x - rect.width, y),
          Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
        );
        var ripple = document.createElement('div');
        ripple.className = 'mb-ripple';
        ripple.style.width = ripple.style.height = (maxDistance * 2) + 'px';
        ripple.style.left = (x - maxDistance) + 'px';
        ripple.style.top = (y - maxDistance) + 'px';
        ripple.style.background = 'radial-gradient(circle, rgba(' + glow + ',0.4) 0%, rgba(' + glow + ',0.15) 35%, transparent 70%)';
        card.appendChild(ripple);
        requestAnimationFrame(function () {
          ripple.style.transform = 'scale(1)';
          ripple.style.opacity = '0';
        });
        setTimeout(function () { ripple.remove(); }, 850);
      });
    });

    if (!reduceMotion) {
      document.addEventListener('mousemove', function (e) {
        var section = grid.closest('.bento-section') || grid;
        var rect = section.getBoundingClientRect();
        var inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (!inside) {
          spotlight.style.opacity = '0';
          cards.forEach(function (c) { c.style.setProperty('--glow-intensity', '0'); });
          return;
        }

        var proximity = spotlightRadius * 0.5;
        var fadeDistance = spotlightRadius * 0.75;
        var minDistance = Infinity;

        cards.forEach(function (card) {
          var cardRect = card.getBoundingClientRect();
          var centerX = cardRect.left + cardRect.width / 2;
          var centerY = cardRect.top + cardRect.height / 2;
          var distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
          var effectiveDistance = Math.max(0, distance);
          minDistance = Math.min(minDistance, effectiveDistance);

          var glowIntensity = 0;
          if (effectiveDistance <= proximity) glowIntensity = 1;
          else if (effectiveDistance <= fadeDistance) glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

          var relX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
          var relY = ((e.clientY - cardRect.top) / cardRect.height) * 100;
          card.style.setProperty('--glow-x', relX + '%');
          card.style.setProperty('--glow-y', relY + '%');
          card.style.setProperty('--glow-intensity', glowIntensity.toString());
          card.style.setProperty('--glow-radius', spotlightRadius + 'px');
        });

        spotlight.style.left = e.clientX + 'px';
        spotlight.style.top = e.clientY + 'px';
        var targetOpacity = minDistance <= proximity ? 0.7 :
          (minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.7 : 0);
        spotlight.style.background = 'radial-gradient(circle, rgba(' + '26,107,255' + ',0.13) 0%, rgba(255,77,77,0.06) 35%, transparent 70%)';
        spotlight.style.opacity = targetOpacity.toString();
      });
    }
  }

  /* ── 4. PROFILE CARD ──────────────────────────────────── */
  function initProfileCard(mount, data) {
    if (!mount) return;
    var wrap = document.createElement('div');
    wrap.className = 'pc-card-wrapper';
    wrap.innerHTML =
      '<div class="pc-behind"></div>' +
      '<div class="pc-card-shell">' +
        '<section class="pc-card">' +
          '<div class="pc-inside">' +
            '<div class="pc-glare"></div>' +
            '<div class="pc-content pc-avatar-content">' +
              '<img class="avatar" src="' + data.avatarUrl + '" alt="' + data.name + ' avatar" loading="lazy">' +
              '<div class="pc-user-info">' +
                '<div class="pc-user-details">' +
                  '<div class="pc-mini-avatar"><img src="' + data.avatarUrl + '" alt="' + data.name + ' mini avatar" loading="lazy"></div>' +
                  '<div class="pc-user-text"><div class="pc-handle">@' + data.handle + '</div><div class="pc-status">' + data.status + '</div></div>' +
                '</div>' +
                '<button class="pc-contact-btn" type="button" aria-label="Contact ' + data.name + '">' + data.contactText + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="pc-content"><div class="pc-details"><h3>' + data.name + '</h3><p>' + data.title + '</p></div></div>' +
          '</div>' +
        '</section>' +
      '</div>';
    mount.appendChild(wrap);

    var shell = wrap.querySelector('.pc-card-shell');
    var btn = wrap.querySelector('.pc-contact-btn');
    btn.addEventListener('click', function () { if (data.onContactClick) data.onContactClick(); });

    if (reduceMotion) return;

    var clamp = function (v, min, max) { return Math.min(Math.max(v, min == null ? 0 : min), max == null ? 100 : max); };
    var round = function (v, p) { p = p || 3; return parseFloat(v.toFixed(p)); };
    var adjust = function (v, fMin, fMax, tMin, tMax) { return round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin)); };

    var currentX = 0, currentY = 0, targetX = 0, targetY = 0;
    var rafId = null, lastTs = 0, running = false;

    function setVarsFromXY(x, y) {
      var width = shell.clientWidth || 1, height = shell.clientHeight || 1;
      var percentX = clamp((100 / width) * x);
      var percentY = clamp((100 / height) * y);
      var centerX = percentX - 50, centerY = percentY - 50;
      var props = {
        '--pointer-x': percentX + '%',
        '--pointer-y': percentY + '%',
        '--background-x': adjust(percentX, 0, 100, 35, 65) + '%',
        '--background-y': adjust(percentY, 0, 100, 35, 65) + '%',
        '--pointer-from-center': clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1),
        '--pointer-from-top': percentY / 100,
        '--pointer-from-left': percentX / 100,
        '--rotate-x': round(-(centerX / 5)) + 'deg',
        '--rotate-y': round(centerY / 4) + 'deg'
      };
      for (var k in props) wrap.style.setProperty(k, props[k]);
    }

    function step(ts) {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      var k = 1 - Math.exp(-dt / 0.14);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      var stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar) { rafId = requestAnimationFrame(step); }
      else { running = false; lastTs = 0; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
    }
    function start() { if (running) return; running = true; lastTs = 0; rafId = requestAnimationFrame(step); }
    function setTarget(x, y) { targetX = x; targetY = y; start(); }
    function toCenter() { setTarget(shell.clientWidth / 2, shell.clientHeight / 2); }

    shell.addEventListener('pointerenter', function (e) {
      shell.classList.add('active', 'entering');
      setTimeout(function () { shell.classList.remove('entering'); }, 180);
      var rect = shell.getBoundingClientRect();
      setTarget(e.clientX - rect.left, e.clientY - rect.top);
    });
    shell.addEventListener('pointermove', function (e) {
      var rect = shell.getBoundingClientRect();
      setTarget(e.clientX - rect.left, e.clientY - rect.top);
    });
    shell.addEventListener('pointerleave', function () {
      toCenter();
      var checkSettle = function () {
        var settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
        if (settled) shell.classList.remove('active');
        else requestAnimationFrame(checkSettle);
      };
      requestAnimationFrame(checkSettle);
    });

    var initialX = (shell.clientWidth || 0) - 70, initialY = 60;
    currentX = initialX; currentY = initialY;
    setVarsFromXY(currentX, currentY);
    toCenter();
  }

  /* ── 5. TEXT PRESSURE ─────────────────────────────────── */
  function initTextPressure(mount, text) {
    if (!mount) return;
    var h1 = document.createElement('h1');
    h1.className = 'text-pressure-title';
    var chars = text.split('');
    var spans = chars.map(function (ch) {
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.setAttribute('data-char', ch);
      return span;
    });
    spans.forEach(function (s) { h1.appendChild(s); });
    mount.appendChild(h1);

    function setSize() {
      var containerW = mount.getBoundingClientRect().width;
      var newFontSize = Math.max(containerW / (chars.length / 2), 28);
      h1.style.fontSize = newFontSize + 'px';
    }
    setSize();
    window.addEventListener('resize', function () {
      clearTimeout(mount._tpResize);
      mount._tpResize = setTimeout(setSize, 100);
    });

    if (reduceMotion) return;

    var mouse = { x: 0, y: 0 }, cursor = { x: 0, y: 0 };
    var rect = mount.getBoundingClientRect();
    mouse.x = cursor.x = rect.left + rect.width / 2;
    mouse.y = cursor.y = rect.top + rect.height / 2;

    window.addEventListener('mousemove', function (e) { cursor.x = e.clientX; cursor.y = e.clientY; });
    window.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; cursor.x = t.clientX; cursor.y = t.clientY;
    }, { passive: true });

    function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
    function getAttr(distance, maxDist, minVal, maxVal) {
      var val = maxVal - Math.abs((maxVal * distance) / maxDist);
      return Math.max(minVal, val + minVal);
    }

    function animate() {
      mouse.x += (cursor.x - mouse.x) / 15;
      mouse.y += (cursor.y - mouse.y) / 15;
      var titleRect = h1.getBoundingClientRect();
      var maxDist = titleRect.width / 2;
      spans.forEach(function (span) {
        var r = span.getBoundingClientRect();
        var center = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        var d = dist(mouse, center);
        var wdth = Math.floor(getAttr(d, maxDist, 25, 150));
        var wght = Math.floor(getAttr(d, maxDist, 300, 900));
        var settings = "'wght' " + wght + ", 'wdth' " + wdth;
        if (span.style.fontVariationSettings !== settings) span.style.fontVariationSettings = settings;
      });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ── INIT ON DOM READY ────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initDotField(document.getElementById('dotFieldMount'));

    initLineSidebar(document.getElementById('lineSidebar'), [
      { label: 'Projects', href: '#projects' },
      { label: 'Experience', href: '#experience' },
      { label: 'Education', href: '#education' },
      { label: 'Certifications', href: '#certifications' },
      { label: 'Contact', href: '#contact' }
    ]);

    initMagicBento(document.getElementById('magicBentoGrid'));

    initProfileCard(document.getElementById('profileCardMount'), {
      avatarUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">' +
        '<rect width="600" height="750" fill="#0a0a0a"/>' +
        '<circle cx="300" cy="290" r="150" fill="#15151a"/>' +
        '<text x="300" y="335" font-family="Syne, sans-serif" font-size="150" font-weight="800" fill="#1a6bff" text-anchor="middle">AN</text>' +
        '</svg>'
      ),
      name: 'S K Abei Nathan',
      title: 'Data Analyst & MBA Candidate',
      handle: 'abeinathan',
      status: 'Open to opportunities',
      contactText: 'Email Me',
      onContactClick: function () { window.location.href = 'mailto:skabeinathan@gmail.com'; }
    });

    initTextPressure(document.getElementById('textPressureMount'), 'DATA · STRATEGY · IMPACT');
  });
})();
