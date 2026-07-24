// Shared posture metrics — the single source of truth for how detected landmarks
// become ratios, and how ratios become qualitative bands. Loaded by both the app
// (app.js) and the calibration lab (lab.js) so the two can never drift apart.
(function (global) {
  "use strict";

  var RANK = { aligned: 0, mild: 1, attention: 2 };

  // Hand-tuned and UNVALIDATED. lab.html exists to calibrate these against real
  // photos — don't trust them until it says the read is repeatable.
  var THRESHOLDS = {
    head: { mildAt: 0.18, attentionAt: 0.4 },
    trunk: { mildAt: 0.12, attentionAt: 0.26 },
    base: { mildAt: 0.1, attentionAt: 0.2 },
  };

  var AREAS = ["head", "trunk", "base"];

  function band(value, mildAt, attentionAt) {
    return value < mildAt ? "aligned" : value < attentionAt ? "mild" : "attention";
  }

  // p = { ear, shoulder, hip, knee, ankle }, normalized points from pose.js.
  // Ratios are normalized by torso/leg height so they survive distance changes;
  // they are relative reads, not clinical angles.
  function computeMetrics(p, thresholds) {
    var t = thresholds || THRESHOLDS;
    var torsoY = Math.abs(p.shoulder.y - p.hip.y) || 0.001;
    var baseY = Math.abs(p.hip.y - p.ankle.y) || 0.001;
    var head = Math.abs(p.ear.x - p.shoulder.x) / torsoY;
    var trunk = Math.abs(p.shoulder.x - p.hip.x) / torsoY;
    var base = Math.abs(p.hip.x - p.ankle.x) / baseY;
    return {
      head: head,
      trunk: trunk,
      base: base,
      headBand: band(head, t.head.mildAt, t.head.attentionAt),
      trunkBand: band(trunk, t.trunk.mildAt, t.trunk.attentionAt),
      baseBand: band(base, t.base.mildAt, t.base.attentionAt),
    };
  }

  // Narrowest band the value can fall in, in ratio units. Used to judge whether
  // shot-to-shot noise is small enough for a band to mean anything. The outer
  // bands are open-ended, so the middle band is the tightest real constraint.
  function narrowestBandWidth(area, thresholds) {
    var t = (thresholds || THRESHOLDS)[area];
    return Math.min(t.mildAt, t.attentionAt - t.mildAt);
  }

  global.PosturAIMetrics = {
    RANK: RANK,
    THRESHOLDS: THRESHOLDS,
    AREAS: AREAS,
    band: band,
    computeMetrics: computeMetrics,
    narrowestBandWidth: narrowestBandWidth,
  };
})(window);
