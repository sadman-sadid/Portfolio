/* Dark Minimal — interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Navigation: pill shrink, smooth anchors, active section
     ------------------------------------------------------------------------ */

  var nav = document.getElementById("main-nav");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var scrollTicking = false;

  function updateNav() {
    if (!nav) return;

    var scrolled = window.scrollY > 0;
    nav.classList.toggle("scrolling", scrolled);

    if (window.innerWidth >= 768) {
      var progress = Math.min(window.scrollY / 1000, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      var start = document.documentElement.clientWidth * 0.8;
      var end = 528;
      nav.style.width = start - (start - end) * eased + "px";
    } else {
      nav.style.width = "";
    }

    scrollTicking = false;
  }

  function requestNavUpdate() {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateNav);
      scrollTicking = true;
    }
  }

  window.addEventListener("scroll", requestNavUpdate, { passive: true });
  window.addEventListener("resize", requestNavUpdate);
  updateNav();

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.indexOf("#!") === 0) return;

      var target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  if ("IntersectionObserver" in window) {
    var sections = document.querySelectorAll("section[id]");
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var id = entry.target.getAttribute("id");
          var hasNavLink = navLinks.some(function (link) {
            return link.getAttribute("href") === "#" + id;
          });
          if (!hasNavLink) return;

          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     Skills accordion — one open at a time
     ------------------------------------------------------------------------ */

  var accordionItems = Array.prototype.slice.call(document.querySelectorAll(".accordion-item"));

  accordionItems.forEach(function (item) {
    var trigger = item.querySelector(".accordion-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");

      accordionItems.forEach(function (other) {
        other.classList.remove("open");
        var otherTrigger = other.querySelector(".accordion-trigger");
        if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ------------------------------------------------------------------------
     Letter glitch canvas
     ------------------------------------------------------------------------ */

  (function letterGlitch() {
    var canvas = document.getElementById("glitch-canvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var COLORS = ["#5e4491", "#A476FF", "#241a38"];
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>,0123456789".split("");
    var SPEED = 33;
    var letters = [];
    var grid = { columns: 0, rows: 0 };
    var lastGlitch = Date.now();
    var frame = null;
    var resizeTimer = null;
    var lastWidth = 0;
    var lastHeight = 0;

    function randomChar() {
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }

    function randomColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function hexToRgb(hex) {
      var value = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function (_, r, g, b) {
        return r + r + g + g + b + b;
      });
      var match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
      return match
        ? { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
        : { r: 255, g: 255, b: 255 };
    }

    function mix(from, to, amount) {
      var r = Math.round(from.r + (to.r - from.r) * amount);
      var g = Math.round(from.g + (to.g - from.g) * amount);
      var b = Math.round(from.b + (to.b - from.b) * amount);
      return "rgb(" + r + ", " + g + ", " + b + ")";
    }

    function draw() {
      var rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "16px monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < letters.length; i++) {
        var letter = letters[i];
        var x = (i % grid.columns) * 10;
        var y = Math.floor(i / grid.columns) * 20;
        ctx.fillStyle = letter.color;
        ctx.fillText(letter.char, x, y);
      }
    }

    function resize() {
      var parent = canvas.parentElement;
      if (!parent) return;

      var rect = parent.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      lastWidth = rect.width;
      lastHeight = rect.height;

      grid.columns = Math.ceil(rect.width / 10);
      grid.rows = Math.ceil(rect.height / 20);

      var total = grid.columns * grid.rows;
      letters = new Array(total);

      for (var i = 0; i < total; i++) {
        var color = randomColor();
        letters[i] = {
          char: randomChar(),
          color: color,
          current: hexToRgb(color),
          target: hexToRgb(randomColor()),
          progress: 1
        };
      }

      draw();
    }

    function mutate() {
      if (!letters.length) return;

      var count = Math.max(1, Math.floor(letters.length * 0.05));
      for (var i = 0; i < count; i++) {
        var index = Math.floor(Math.random() * letters.length);
        var letter = letters[index];
        if (!letter) continue;

        letter.char = randomChar();
        var targetColor = randomColor();
        letter.target = hexToRgb(targetColor);
        letter.progress = 0;
      }
    }

    function fadeColors() {
      var changed = false;

      for (var i = 0; i < letters.length; i++) {
        var letter = letters[i];
        if (letter.progress < 1) {
          letter.progress = Math.min(1, letter.progress + 0.05);
          letter.color = mix(letter.current, letter.target, letter.progress);
          if (letter.progress === 1) letter.current = letter.target;
          changed = true;
        }
      }

      if (changed) draw();
    }

    function loop() {
      var now = Date.now();
      if (now - lastGlitch >= SPEED) {
        mutate();
        draw();
        lastGlitch = now;
      }
      fadeColors();
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      resize();
      if (reduceMotion) return;
      if (frame) window.cancelAnimationFrame(frame);
      lastGlitch = Date.now();
      loop();
    }

    start();

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var parent = canvas.parentElement;
        if (!parent) return;
        var rect = parent.getBoundingClientRect();
        if (rect.width === lastWidth && rect.height === lastHeight) return;

        if (frame) window.cancelAnimationFrame(frame);
        frame = null;
        start();
      }, 100);
    });
  })();

  /* ------------------------------------------------------------------------
     Like button
     ------------------------------------------------------------------------ */

  (function likeButton() {
    var button = document.getElementById("like-button");
    var count = document.getElementById("like-count");
    if (!button || !count) return;

    var STORAGE_KEY = "dark-minimal-likes";
    var likes = 0;

    try {
      likes = parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
    } catch (error) {
      likes = 0;
    }

    function render() {
      count.textContent = likes + (likes === 1 ? " Like" : " Likes");
      button.classList.toggle("liked", likes > 0);
      button.setAttribute("aria-pressed", likes > 0 ? "true" : "false");
    }

    render();

    button.addEventListener("click", function () {
      likes += 1;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(likes));
      } catch (error) {
        /* storage may be unavailable; the counter still updates for this visit */
      }

      render();
      button.classList.remove("pop");
      void button.offsetWidth;
      button.classList.add("pop");
    });
  })();

  /* ------------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------------ */

  (function contactForm() {
    var form = document.getElementById("contact-form");
    var message = document.getElementById("form-message");
    if (!form || !message) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var action = form.getAttribute("action") || "";
      var configured = action.indexOf("YOUR_FORM_ID_HERE") === -1;

      if (configured) {
        try {
          var response = await fetch(action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
          });

          if (!response.ok) throw new Error("Request failed");
        } catch (error) {
          window.alert("There was a problem sending your message.");
          return;
        }
      }

      form.reset();
      form.hidden = true;
      message.hidden = false;
      message.focus({ preventScroll: true });
    });

    message.setAttribute("tabindex", "-1");
  })();
})();
