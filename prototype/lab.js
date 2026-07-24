// Repeatability Lab — answers the LLM Council's "validate this first" question:
// does a single hand-held 2D photo give a *repeatable* read shot-to-shot?
//
// Method: run N photos of one person holding ONE posture through the exact same
// pipeline the app uses (pose.js -> metrics.js), then measure how much the output
// moves. Since the posture didn't change, everything we see is noise.
(function () {
  "use strict";

  var M = window.PosturAIMetrics;
  var AREA_LABEL = { head: "Head position", trunk: "Shoulders & trunk", base: "Hips & base" };
  var BAND_LABEL = {
    head: { aligned: "Well aligned", mild: "Slightly forward", attention: "Noticeably forward" },
    trunk: { aligned: "Upright", mild: "Slightly rounded", attention: "Noticeably rounded" },
    base: { aligned: "Well aligned", mild: "Slightly off", attention: "Noticeably off" },
  };
  var FAIL_LABEL = {
    "no-pose": "no person detected",
    "low-confidence": "person found, but ear/shoulder/hip weren't confident",
    "too-small": "subject too small in frame",
    engine: "pose engine error",
    load: "image failed to load",
  };

  // How wide the shot-to-shot spread may be, as a share of the narrowest band,
  // before a band verdict stops meaning anything.
  var NOISE_OK = 0.25;
  var NOISE_BORDERLINE = 0.5;

  var $ = function (id) { return document.getElementById(id); };
  var rows = [];   // successful reads
  var fails = [];  // { name, reason }

  // ---------- stats ----------

  function mean(xs) {
    return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
  }
  // Sample standard deviation (n-1): these photos are a sample of the shots a
  // user might take, not the whole population of them.
  function stdev(xs) {
    if (xs.length < 2) return 0;
    var m = mean(xs);
    var ss = xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0);
    return Math.sqrt(ss / (xs.length - 1));
  }

  function summarize(area) {
    var vals = rows.map(function (r) { return r.m[area]; });
    var bands = rows.map(function (r) { return r.m[area + "Band"]; });
    var distinct = bands.filter(function (b, i) { return bands.indexOf(b) === i; });
    var sd = stdev(vals);
    var bandWidth = M.narrowestBandWidth(area);
    var noise = (2 * sd) / bandWidth; // ±2 SD spread as a share of one band

    var rating;
    if (distinct.length > 1) rating = noise < NOISE_BORDERLINE ? "borderline" : "unstable";
    else if (noise < NOISE_OK) rating = "stable";
    else if (noise < NOISE_BORDERLINE) rating = "borderline";
    else rating = "unstable";

    return {
      area: area, n: vals.length, mean: mean(vals), sd: sd,
      min: Math.min.apply(null, vals), max: Math.max.apply(null, vals),
      noise: noise, bandWidth: bandWidth, bands: bands, distinct: distinct, rating: rating,
    };
  }

  // ---------- rendering ----------

  function fmt(x, dp) { return x.toFixed(dp == null ? 3 : dp); }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function pill(cls, text) {
    return '<span class="pill ' + cls + '">' + esc(text) + "</span>";
  }

  function renderVerdict(sums, total) {
    var worst = sums.reduce(function (w, s) {
      var order = { stable: 0, borderline: 1, unstable: 2 };
      return order[s.rating] > order[w.rating] ? s : w;
    }, sums[0]);
    var detection = rows.length / total;

    var card = $("verdict-card");
    card.className = "verdict-card " + worst.rating;

    var line, copy;
    if (worst.rating === "stable") {
      line = "The read holds still.";
      copy = "Across " + rows.length + " shots of the same posture, every measure stayed inside one " +
        "band and the spread was small relative to the band width. A change shown to a user would " +
        "more likely be a real change than camera noise — a progress feature has a foundation.";
    } else if (worst.rating === "borderline") {
      line = "Repeatable enough to show, not to trend.";
      copy = "The measures mostly hold, but " + esc(AREA_LABEL[worst.area].toLowerCase()) +
        " moves enough that a shot near a band boundary can land either side of it. Safe to show a " +
        "single read; not safe to draw a before/after arrow from two of them without tightening capture first.";
    } else {
      line = "Not repeatable yet — don't ship a trend on this.";
      copy = "Holding the same posture, " + esc(AREA_LABEL[worst.area].toLowerCase()) +
        " swung far enough to change the verdict the app would give. Any progress or " +
        "before/after feature built on this would be showing the user camera noise and calling it " +
        "improvement. Fix capture consistency (or widen the bands) before building on top of it.";
    }
    if (detection < 0.8) {
      copy += " Separately, only " + pct(detection) + " of the photos produced a readable pose at all — " +
        "that failure rate is its own product problem.";
    }
    $("verdict-line").textContent = line;
    $("verdict-copy").textContent = copy;
  }

  function renderStats(sums, total) {
    var worstNoise = Math.max.apply(null, sums.map(function (s) { return s.noise; }));
    var flips = sums.filter(function (s) { return s.distinct.length > 1; }).length;
    var tiles = [
      [rows.length + " / " + total, "photos produced a readable pose"],
      [pct(worstNoise), "widest shot-to-shot spread, as a share of one band"],
      [String(flips), flips === 1 ? "measure changed its verdict" : "measures changed their verdict"],
    ];
    $("stat-row").innerHTML = tiles.map(function (t) {
      return '<div class="stat"><p class="stat-val">' + esc(t[0]) + '</p>' +
             '<p class="stat-label">' + esc(t[1]) + "</p></div>";
    }).join("");
  }

  function renderSummaryTable(sums) {
    var head = "<thead><tr><th>Measure</th><th>Mean</th><th>SD</th><th>Min</th><th>Max</th>" +
      "<th>Band width</th><th>Noise (±2 SD)</th><th>Verdict</th></tr></thead>";
    var body = sums.map(function (s) {
      return "<tr><td>" + esc(AREA_LABEL[s.area]) + "</td>" +
        '<td class="num">' + fmt(s.mean) + "</td>" +
        '<td class="num">' + fmt(s.sd) + "</td>" +
        '<td class="num">' + fmt(s.min) + "</td>" +
        '<td class="num">' + fmt(s.max) + "</td>" +
        '<td class="num">' + fmt(s.bandWidth) + "</td>" +
        '<td class="num">' + pct(s.noise) + "</td>" +
        "<td>" + pill(s.rating, s.rating) + "</td></tr>";
    }).join("");
    $("summary-tbl").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function renderFlips(sums) {
    $("flips").innerHTML = sums.map(function (s) {
      var counts = {};
      s.bands.forEach(function (b) { counts[b] = (counts[b] || 0) + 1; });
      var chips = Object.keys(counts).map(function (b) {
        return pill(b, BAND_LABEL[s.area][b] + " ×" + counts[b]);
      }).join("");
      var msg = s.distinct.length === 1
        ? "One verdict across every shot. This measure would not have lied to the user."
        : "The app gave " + s.distinct.length + " different verdicts for one unchanged posture.";
      return '<div class="flip"><h4>' + esc(AREA_LABEL[s.area]) + "</h4>" +
             "<p>" + esc(msg) + '</p><div class="bands">' + chips + "</div></div>";
    }).join("");
  }

  function renderDetail() {
    var head = "<thead><tr><th>Photo</th><th>Head</th><th>Trunk</th><th>Base</th>" +
      "<th>Verdicts</th><th>Confidence</th></tr></thead>";
    var body = rows.map(function (r) {
      var bands = M.AREAS.map(function (a) { return pill(r.m[a + "Band"], r.m[a + "Band"]); }).join(" ");
      return "<tr><td>" + esc(r.name) + "</td>" +
        '<td class="num">' + fmt(r.m.head) + "</td>" +
        '<td class="num">' + fmt(r.m.trunk) + "</td>" +
        '<td class="num">' + fmt(r.m.base) + "</td>" +
        "<td>" + bands + "</td>" +
        '<td class="num">' + fmt(r.vis, 2) + "</td></tr>";
    }).join("");
    $("detail-tbl").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function renderFailures() {
    if (!fails.length) { $("failures").innerHTML = ""; return; }
    var items = fails.map(function (f) {
      return "<li>" + esc(f.name) + " — " + esc(FAIL_LABEL[f.reason] || f.reason) + "</li>";
    }).join("");
    $("failures").innerHTML =
      '<div class="fail-box"><h4>' + fails.length + " photo" + (fails.length === 1 ? "" : "s") +
      " couldn't be read</h4><p>These are counted in the detection rate but excluded from the " +
      "statistics — a shot the app can't read produces no number to compare.</p><ul>" + items + "</ul></div>";
  }

  function report() {
    var total = rows.length + fails.length;
    if (!rows.length) {
      $("verdict-card").className = "verdict-card unstable";
      $("verdict-line").textContent = "No photo could be read.";
      $("verdict-copy").textContent =
        "None of the " + total + " photos produced a usable pose, so there's nothing to measure. " +
        "Check that they're full-body side-on shots with the subject clearly separated from the background.";
      ["stat-row", "summary-tbl", "flips", "detail-tbl"].forEach(function (id) { $(id).innerHTML = ""; });
      renderFailures();
      return;
    }
    var sums = M.AREAS.map(summarize);
    renderVerdict(sums, total);
    renderStats(sums, total);
    renderSummaryTable(sums);
    renderFlips(sums);
    renderDetail();
    renderFailures();
  }

  // ---------- pipeline ----------

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

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("load")); };
      img.src = url;
    });
  }

  function progress(done, total, label) {
    $("bar-fill").style.width = Math.round((done / total) * 100) + "%";
    $("run-label").textContent = label;
  }

  function run(files) {
    rows = []; fails = [];
    $("results").hidden = true;
    $("run").hidden = false;
    progress(0, files.length, "Loading the pose model…");

    waitForPose(15000).then(function (ok) {
      if (!ok || !window.PosturAIPose) {
        progress(1, 1, "Couldn't load the pose engine — it needs internet on first run.");
        return;
      }
      // Sequential, not parallel: one landmarker instance, and a steady queue
      // keeps the progress count honest on a big batch.
      var i = 0;
      function next() {
        if (i >= files.length) {
          $("run").hidden = true;
          $("results").hidden = false;
          report();
          return;
        }
        var file = files[i++];
        progress(i - 1, files.length, "Analyzing " + i + " of " + files.length + " — " + file.name);
        loadImage(file)
          .then(function (loaded) {
            return window.PosturAIPose.analyze(loaded.img).then(function (res) {
              URL.revokeObjectURL(loaded.url);
              if (res.ok) {
                rows.push({ name: file.name, m: M.computeMetrics(res.points), vis: res.avgVisibility });
              } else {
                fails.push({ name: file.name, reason: res.reason });
              }
            });
          })
          .catch(function (e) { fails.push({ name: file.name, reason: e.message === "load" ? "load" : "engine" }); })
          .then(next);
      }
      next();
    });
  }

  function toCSV() {
    var head = "photo,head,trunk,base,head_band,trunk_band,base_band,confidence\n";
    var body = rows.map(function (r) {
      return [
        '"' + r.name.replace(/"/g, '""') + '"',
        fmt(r.m.head), fmt(r.m.trunk), fmt(r.m.base),
        r.m.headBand, r.m.trunkBand, r.m.baseBand, fmt(r.vis, 2),
      ].join(",");
    }).join("\n");
    var failed = fails.map(function (f) {
      return ['"' + f.name.replace(/"/g, '""') + '"', "", "", "", "", "", "", "FAILED: " + f.reason].join(",");
    }).join("\n");
    return head + body + (failed ? "\n" + failed : "") + "\n";
  }

  // ---------- wiring ----------

  var drop = $("drop"), input = $("files");

  function pick(fileList) {
    var files = Array.prototype.slice.call(fileList).filter(function (f) {
      return f.type.indexOf("image/") === 0;
    });
    if (files.length) run(files);
  }

  drop.addEventListener("click", function () { input.click(); });
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
  });
  input.addEventListener("change", function () { pick(input.files); input.value = ""; });

  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files) pick(e.dataTransfer.files);
  });

  $("csv").addEventListener("click", function () {
    var blob = new Blob([toCSV()], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "posturai-repeatability.csv";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $("reset").addEventListener("click", function () {
    rows = []; fails = [];
    $("results").hidden = true;
    drop.focus();
  });

  if (window.PosturAIPose) window.PosturAIPose.preload();
  else waitForPose(15000).then(function (ok) { if (ok) window.PosturAIPose.preload(); });
})();
