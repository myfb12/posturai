// PosturAI prototype — view routing, skeleton timing, small camera micro-interactions.
(function () {
  "use strict";

  var VIEWS = ["consent", "home", "capture", "analyze", "result", "compare"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(id) { return document.getElementById(id); }
  function view(name) { return el("v-" + name); }

  var homeLoaded = false;
  var analyzeTimer = null;

  function show(name) {
    VIEWS.forEach(function (n) {
      view(n).classList.toggle("active", n === name);
    });
    // scroll each shown view back to top
    var body = view(name).querySelector(".view__body");
    if (body) body.scrollTop = 0;

    updateFlownav(name);
    updateTabbars(name);

    if (name === "capture") startCamera(); else stopCamera();

    if (name === "home") runHomeSkeleton();
    if (name === "analyze") runAnalyze();
    else if (analyzeTimer) { clearTimeout(analyzeTimer); analyzeTimer = null; }
  }

  // --- Live camera ---
  var stream = null;
  var facing = "environment";
  var capturedURL = null;

  function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function showCamHint(html) {
    var hint = el("cam-hint");
    if (!hint) return;
    if (html) { hint.innerHTML = html; hint.hidden = false; } else { hint.hidden = true; }
  }

  function preloadPose() {
    if (window.PosturAIPose) { try { window.PosturAIPose.preload(); } catch (e) {} }
    else waitForPose(8000).then(function (ok) { if (ok && window.PosturAIPose) window.PosturAIPose.preload(); });
  }

  function startCamera() {
    preloadPose(); // warm up the on-device model while the user frames the shot
    var video = el("cam-video");
    var cam = document.querySelector("#v-capture .cam");
    if (!video) return;

    if (!hasGetUserMedia()) {
      // Not a secure context (plain http on a phone) or unsupported browser.
      showCamHint(
        location.protocol === "https:"
          ? "<b>Camera not available on this browser.</b> The guide still works — tap the shutter to continue."
          : "<b>Open this page over HTTPS to use the camera.</b> On http the browser blocks it. The guide still works — tap the shutter to continue."
      );
      return;
    }

    if (stream) return; // already running
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        video.classList.add("on");
        if (cam) cam.classList.add("has-camera");
        showCamHint(null);
        var p = video.play(); if (p && p.catch) p.catch(function () {});
      })
      .catch(function (err) {
        var denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
        showCamHint(
          denied
            ? "<b>Camera permission was blocked.</b> Allow camera access in your browser settings, then reopen this screen. The guide still works without it."
            : "<b>No camera found.</b> The guide still works — tap the shutter to continue."
        );
      });
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    var video = el("cam-video");
    if (video) { video.classList.remove("on"); video.srcObject = null; }
    var cam = document.querySelector("#v-capture .cam");
    if (cam) cam.classList.remove("has-camera");
  }

  function flipCamera() {
    facing = facing === "environment" ? "user" : "environment";
    stopCamera();
    startCamera();
  }

  // Grab a still from the live video when the shutter is pressed.
  function captureFrame() {
    var video = el("cam-video");
    var canvas = el("cam-canvas");
    if (!video || !canvas || !video.videoWidth) { capturedURL = null; return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    try { capturedURL = canvas.toDataURL("image/jpeg", 0.85); } catch (e) { capturedURL = null; }
    applyCapturedPhoto();
  }

  function applyCapturedPhoto() {
    var aPhoto = el("analyze-photo");
    var rPhoto = el("result-photo");
    var wrap = el("your-capture");
    if (capturedURL) {
      if (aPhoto) { aPhoto.src = capturedURL; aPhoto.hidden = false; }
      if (rPhoto) rPhoto.src = capturedURL;
      if (wrap) wrap.hidden = false;
    } else {
      if (aPhoto) aPhoto.hidden = true;
      if (wrap) wrap.hidden = true;
    }
  }

  // --- Home: skeleton -> real content ---
  function runHomeSkeleton() {
    var skel = el("lastcheck-skel");
    var real = el("lastcheck-real");
    if (homeLoaded) { skel.hidden = true; real.hidden = false; return; }
    skel.hidden = false; real.hidden = true;
    var delay = reduceMotion ? 250 : 1100;
    setTimeout(function () {
      skel.hidden = true; real.hidden = false; homeLoaded = true;
    }, delay);
  }

  // --- Analyze: run real pose detection (if we have a photo), then show result ---
  var resultDefaults = null;

  function snapshotDefaults() {
    if (resultDefaults) return;
    resultDefaults = {
      eyebrow: el("result-eyebrow").innerHTML,
      title: el("result-title").innerHTML,
      bandCls: el("verdict-band").className,
      bandText: el("verdict-band").textContent,
      copy: el("verdict-copy").innerHTML,
      findings: el("findings").innerHTML,
    };
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  function waitForPose(timeout) {
    return new Promise(function (resolve) {
      if (window.PosturAIPose) return resolve(true);
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(false); } }, timeout);
      window.addEventListener("posturai-pose-ready", function () {
        if (!done) { done = true; clearTimeout(t); resolve(true); }
      }, { once: true });
    });
  }

  function runAnalyze() {
    view("analyze").setAttribute("aria-busy", "true");
    var minTime = reduceMotion ? 500 : 2200;
    var started = Date.now();
    var pending;

    if (capturedURL) {
      pending = waitForPose(5000)
        .then(function (ok) {
          if (!ok || !window.PosturAIPose) return { img: null, res: { ok: false, reason: "engine" } };
          return loadImage(capturedURL).then(function (img) {
            return window.PosturAIPose.analyze(img).then(function (res) { return { img: img, res: res }; });
          });
        })
        .catch(function () { return { img: null, res: { ok: false, reason: "engine" } }; });
    } else {
      pending = Promise.resolve(null); // click-through demo → mock
    }

    pending.then(function (out) {
      var delay = Math.max(0, minTime - (Date.now() - started));
      analyzeTimer = setTimeout(function () {
        view("analyze").setAttribute("aria-busy", "false");
        if (!out) renderMock();
        else if (out.res && out.res.ok) renderReal(out.img, out.res.points);
        else renderFail(out.res);
        show("result");
      }, delay);
    });
  }

  // --- Metrics + bands from detected landmarks ---
  var RANK = { aligned: 0, mild: 1, attention: 2 };

  function band(value, mildAt, attentionAt) {
    return value < mildAt ? "aligned" : value < attentionAt ? "mild" : "attention";
  }

  function computeMetrics(p) {
    var torsoY = Math.abs(p.shoulder.y - p.hip.y) || 0.001;
    var baseY = Math.abs(p.hip.y - p.ankle.y) || 0.001;
    var head = Math.abs(p.ear.x - p.shoulder.x) / torsoY;
    var trunk = Math.abs(p.shoulder.x - p.hip.x) / torsoY;
    var base = Math.abs(p.hip.x - p.ankle.x) / baseY;
    return {
      head: head, trunk: trunk, base: base,
      headBand: band(head, 0.18, 0.4),
      trunkBand: band(trunk, 0.12, 0.26),
      baseBand: band(base, 0.1, 0.2),
    };
  }

  var BAND_LABEL = {
    head: { aligned: "Well aligned", mild: "Slightly forward", attention: "Noticeably forward" },
    trunk: { aligned: "Upright", mild: "Slightly rounded", attention: "Noticeably rounded" },
    base: { aligned: "Well aligned", mild: "Slightly off", attention: "Noticeably off" },
  };
  var BAND_COPY = {
    head: {
      aligned: "Your ear stacks nicely over your shoulder — no forward-head lean to speak of.",
      mild: "Your ear sits a little ahead of your shoulder. Common from screen time, and easy to reset.",
      attention: "Your ear sits well ahead of your shoulder — the classic screen-lean that tightens the neck.",
    },
    trunk: {
      aligned: "Your shoulders stack cleanly over your hips. Nice upright carriage.",
      mild: "A gentle forward curl through the upper back. A few resets a day opens it up.",
      attention: "A pronounced forward rounding through the upper back — worth some daily opening work.",
    },
    base: {
      aligned: "Your hips stack cleanly over your ankles — a solid, balanced base.",
      mild: "Your hips drift a touch from over your ankles. Minor, but worth noticing.",
      attention: "Your hips sit noticeably off from over your ankles, shifting your whole line.",
    },
  };

  function findingHTML(area, b) {
    return (
      '<div class="finding ' + b + '"><span class="dot" aria-hidden="true"></span><div>' +
      "<h4>" + { head: "Head position", trunk: "Shoulders &amp; trunk", base: "Hips &amp; base" }[area] +
      ' <span class="band">' + BAND_LABEL[area][b] + "</span></h4>" +
      "<p>" + BAND_COPY[area][b] + "</p></div></div>"
    );
  }

  function setHidden(node, hide) {
    if (!node) return;
    if (hide) node.setAttribute("hidden", ""); else node.removeAttribute("hidden");
  }
  function setFigureMode(mode) {
    setHidden(el("figure-mock"), mode !== "mock");   // SVG: must toggle the attribute, not .hidden
    setHidden(el("figure-canvas"), mode !== "real");
    setHidden(el("figure-fail"), mode !== "fail");
    setHidden(document.querySelector("#v-result .fix-card"), mode === "fail");
  }

  function renderMock() {
    snapshotDefaults();
    setFigureMode("mock");
    el("result-eyebrow").innerHTML = resultDefaults.eyebrow;
    el("result-title").innerHTML = resultDefaults.title;
    el("verdict-band").className = resultDefaults.bandCls;
    el("verdict-band").textContent = resultDefaults.bandText;
    el("verdict-copy").innerHTML = resultDefaults.copy;
    el("findings").innerHTML = resultDefaults.findings;
  }

  function renderReal(img, points) {
    snapshotDefaults();
    setFigureMode("real");
    var m = computeMetrics(points);
    drawPose(img, points, m);

    var overall = ["head", "trunk", "base"].reduce(function (worst, k) {
      return RANK[m[k + "Band"]] > RANK[worst] ? m[k + "Band"] : worst;
    }, "aligned");

    var title, bandText, bandCls, copy;
    if (overall === "aligned") {
      title = "You're stacking<br>up well.";
      bandText = "Nicely aligned"; bandCls = "verdict-band band--aligned";
      copy = "Ear over shoulder, shoulders over hips, hips over ankles — a clean vertical line. Keep doing what you're doing.";
    } else if (m.headBand !== "aligned" && RANK[m.headBand] >= RANK[m.trunkBand]) {
      title = "Your head leans<br>forward.";
      bandText = (m.headBand === "attention" ? "Noticeably forward" : "Slightly forward") + " · room to lift";
      bandCls = "verdict-band " + (m.headBand === "attention" ? "band--attention" : "band--mild");
      copy = "Your base looks steady — the story is up top. " + BAND_COPY.head[m.headBand];
    } else {
      title = "A little to<br>work on.";
      bandText = "Room to lift"; bandCls = "verdict-band band--mild";
      copy = "A few areas are drifting from a clean vertical line. Nothing dramatic — small daily resets go a long way.";
    }
    el("result-eyebrow").textContent = "Your read · on-device";
    el("result-title").innerHTML = title;
    el("verdict-band").className = bandCls;
    el("verdict-band").textContent = bandText;
    el("verdict-copy").textContent = copy;

    var areas = ["head", "trunk", "base"].sort(function (a, b) {
      return RANK[m[b + "Band"]] - RANK[m[a + "Band"]];
    });
    el("findings").innerHTML = areas.map(function (a) { return findingHTML(a, m[a + "Band"]); }).join("");
  }

  function renderFail(res) {
    snapshotDefaults();
    setFigureMode("fail");
    el("result-eyebrow").textContent = "Your read · on-device";
    el("result-title").innerHTML = "Let's get a<br>clearer shot.";
    el("verdict-band").className = "verdict-band band--mild";
    el("verdict-band").textContent = "Couldn't read your pose";
    var why = res && res.reason === "engine"
      ? "The on-device model couldn't load or run on this device."
      : "We couldn't find a clear, full-body side-on pose in that photo.";
    el("verdict-copy").textContent = why + " Try again with your whole body in frame, side-on, in good light.";
    el("findings").innerHTML = "";
  }

  // Draw the photo + detected skeleton onto the result canvas.
  function drawPose(img, p, m) {
    var canvas = el("figure-canvas");
    var maxW = 720;
    var scale = Math.min(1, maxW / img.naturalWidth);
    var cw = Math.round(img.naturalWidth * scale);
    var ch = Math.round(img.naturalHeight * scale);
    canvas.width = cw; canvas.height = ch;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, cw, ch);
    // gentle darkening for overlay legibility
    ctx.fillStyle = "rgba(10,18,20,0.18)";
    ctx.fillRect(0, 0, cw, ch);

    var COL = { aligned: "#33c79b", mild: "#efb43c", attention: "#f2794b" };
    var P = function (pt) { return { x: pt.x * cw, y: pt.y * ch }; };
    var ear = P(p.ear), sh = P(p.shoulder), hip = P(p.hip), knee = P(p.knee), ank = P(p.ankle);
    var lw = Math.max(3, cw * 0.008);

    // aligned reference line dropped from the ankle
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, cw * 0.004);
    ctx.setLineDash([cw * 0.02, cw * 0.02]);
    ctx.beginPath(); ctx.moveTo(ank.x, ear.y - ch * 0.06); ctx.lineTo(ank.x, ank.y); ctx.stroke();
    ctx.restore();

    function seg(a, b, color) {
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    seg(ear, sh, COL[m.headBand]);
    seg(sh, hip, COL[m.trunkBand]);
    seg(hip, knee, COL[m.baseBand]);
    seg(knee, ank, COL[m.baseBand]);

    function node(pt, color) {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, lw * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = lw * 0.7; ctx.strokeStyle = color; ctx.stroke();
    }
    node(ear, COL[m.headBand]); node(sh, COL[m.trunkBand]); node(hip, COL[m.baseBand]);
    node(knee, COL[m.baseBand]); node(ank, COL[m.baseBand]);
  }

  // --- Flow nav (outside phone) ---
  function updateFlownav(name) {
    var nav = el("flownav");
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
      var on = b.getAttribute("data-jump") === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  // --- Bottom tab bars (rendered into each .tabbar) ---
  var TAB_SVG = {
    home: '<path d="M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    cap: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
  };
  function tabbarHTML(active) {
    function stroke(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + TAB_SVG[k] + '</svg>'; }
    return '' +
      '<button class="tab ' + (active === "home" ? "active" : "") + '" data-go="home">' + stroke("home") + 'Today</button>' +
      '<button class="tab tab--cap" data-go="capture" aria-label="New posture check"><span class="cap-btn">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + TAB_SVG.cap + '</svg></span><span class="cap-lbl">Check</span></button>' +
      '<button class="tab ' + (active === "compare" ? "active" : "") + '" data-go="compare">' + stroke("progress") + 'Progress</button>';
  }
  function updateTabbars(name) {
    var active = name === "compare" ? "compare" : "home";
    Array.prototype.forEach.call(document.querySelectorAll(".tabbar"), function (bar) {
      bar.innerHTML = tabbarHTML(active);
    });
  }

  // --- Camera bubble level: subtle idle wobble that settles ---
  function animateLevel() {
    if (reduceMotion) return;
    var bubble = el("bubble");
    if (!bubble) return;
    var t = 0;
    setInterval(function () {
      if (!view("capture").classList.contains("active")) return;
      t += 0.06;
      var x = Math.sin(t) * Math.max(0, 6 - t * 0.4); // wobble that decays then holds near center
      bubble.style.transform = "translateX(" + x.toFixed(1) + "px)";
    }, 60);
  }

  // --- Global click routing ---
  document.addEventListener("click", function (e) {
    if (e.target.closest("#cam-flip")) { flipCamera(); return; }
    if (e.target.closest("#pick-file")) { var fi = el("file-input"); if (fi) fi.click(); return; }
    if (e.target.closest("#shutter")) { captureFrame(); /* fall through to data-go navigation */ }
    var go = e.target.closest("[data-go]");
    if (go) { show(go.getAttribute("data-go")); return; }
    var jump = e.target.closest("[data-jump]");
    if (jump) {
      homeLoaded = false;               // replay skeletons when jumping directly
      show(jump.getAttribute("data-jump"));
    }
  });

  // keyboard: left/right arrows step through the flow
  document.addEventListener("keydown", function (e) {
    var current = VIEWS.find(function (n) { return view(n).classList.contains("active"); });
    var i = VIEWS.indexOf(current);
    if (e.key === "ArrowRight" && i < VIEWS.length - 1) show(VIEWS[i + 1]);
    if (e.key === "ArrowLeft" && i > 0) show(VIEWS[i - 1]);
  });

  // gallery / file picker
  var fileInput = el("file-input");
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        capturedURL = reader.result;
        applyCapturedPhoto();
        stopCamera();
        show("analyze");
      };
      reader.readAsDataURL(f);
      fileInput.value = ""; // allow re-picking the same file
    });
  }

  // init
  snapshotDefaults();
  updateTabbars("home");
  updateFlownav("consent");
  animateLevel();

  // expose for Playwright/testing
  window.PosturAI = {
    show: show, VIEWS: VIEWS,
    _renderReal: renderReal, _renderFail: renderFail, _renderMock: renderMock,
    _loadImage: loadImage,
    _setCaptured: function (url) { capturedURL = url; applyCapturedPhoto(); },
  };
})();
