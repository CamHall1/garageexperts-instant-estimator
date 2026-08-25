/**
 * GarageExperts Instant Estimator -- parent-page embed helper.
 *
 * Include after the iframe markup:
 *   <iframe id="garageexperts-estimator" src="https://YOUR-DOMAIN/embed" ...></iframe>
 *   <script src="https://YOUR-DOMAIN/embed.js" defer></script>
 *
 * This script only resizes the iframe, validates the child's origin, and
 * forwards anonymous funnel events to an optional callback. It never installs
 * an advertising pixel itself -- wire your existing Meta/Google tags to
 * window.GarageExpertsEstimator.onEvent if you want parent-owned tracking.
 */
(function () {
  "use strict";

  var NAMESPACE = "garageexperts-estimator";
  var PROTOCOL_VERSION = 1;
  var MIN_HEIGHT_PX = 480;
  var MAX_HEIGHT_PX = 6000;

  function isEnvelope(data) {
    return (
      data &&
      typeof data === "object" &&
      data.namespace === NAMESPACE &&
      data.version === PROTOCOL_VERSION &&
      typeof data.type === "string"
    );
  }

  function captureAttribution() {
    var params = new URLSearchParams(window.location.search);
    var keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "gclid",
      "gbraid",
      "wbraid",
      "fbclid",
    ];
    var attribution = {};
    keys.forEach(function (key) {
      attribution[key] = params.get(key) || "";
    });
    return attribution;
  }

  function initEstimator(iframe, options) {
    options = options || {};
    var childOrigin = null;
    try {
      childOrigin = new URL(iframe.src, window.location.href).origin;
    } catch (e) {
      console.error("[garageexperts-estimator] invalid iframe src", e);
      return;
    }

    function sendInit() {
      iframe.contentWindow.postMessage(
        {
          namespace: NAMESPACE,
          version: PROTOCOL_VERSION,
          type: "init",
          event_id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
          payload: {
            attribution: captureAttribution(),
            parentOrigin: window.location.origin,
          },
        },
        childOrigin,
      );
    }

    function handleMessage(event) {
      if (event.origin !== childOrigin) return;
      if (!isEnvelope(event.data)) return;
      var msg = event.data;

      if (msg.type === "ready") {
        sendInit();
        return;
      }

      if (msg.type === "resize") {
        var height = Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, Number(msg.payload.height) || 0));
        iframe.style.height = height + "px";
        return;
      }

      if (typeof options.onEvent === "function") {
        options.onEvent(msg.type, msg.payload);
      }
    }

    window.addEventListener("message", handleMessage);
    iframe.style.height = MIN_HEIGHT_PX + "px";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.width = "100%";
  }

  window.GarageExpertsEstimator = {
    init: initEstimator,
  };

  // Auto-init any iframe marked with data-ge-estimator, so the copy-paste
  // snippet in docs/IFRAME_EMBED.md works with zero extra JS.
  document.addEventListener("DOMContentLoaded", function () {
    var iframes = document.querySelectorAll("iframe[data-ge-estimator], #garageexperts-estimator");
    iframes.forEach(function (iframe) {
      initEstimator(iframe);
    });
  });
})();
