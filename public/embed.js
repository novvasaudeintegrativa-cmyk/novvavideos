(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var videoId = script.getAttribute("data-video-id");
  if (!videoId) return;

  var autoplay = script.getAttribute("data-autoplay") === "true";
  var muted = script.getAttribute("data-muted") === "true";
  var width = script.getAttribute("data-width");
  var height = script.getAttribute("data-height");
  var responsive = script.getAttribute("data-responsive") !== "false";
  var targetId = script.getAttribute("data-target");

  var origin = (function () {
    var src = script.src;
    var i = src.indexOf("/embed.js");
    return i > -1 ? src.slice(0, i) : "";
  })();

  function getSessionId() {
    try {
      var key = "novva_session_id";
      var existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      var fresh =
        "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      window.sessionStorage.setItem(key, fresh);
      return fresh;
    } catch {
      return "s_" + Date.now().toString(36);
    }
  }

  function buildSrc() {
    var params = new URLSearchParams();
    if (autoplay) params.set("autoplay", "1");
    if (muted || autoplay) params.set("muted", "1");
    params.set("session_id", getSessionId());
    params.set("page_url", window.location.href);

    var utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    try {
      var pageParams = new URLSearchParams(window.location.search);
      utmKeys.forEach(function (key) {
        var value = pageParams.get(key);
        if (value) params.set(key, value);
      });
    } catch {
      /* ignore */
    }

    return origin + "/p/" + encodeURIComponent(videoId) + "?" + params.toString();
  }

  var iframe = document.createElement("iframe");
  iframe.src = buildSrc();
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.style.border = "0";
  iframe.title = "Novva Videos player";

  var mount;
  if (targetId) {
    mount = document.getElementById(targetId);
  }

  if (responsive) {
    iframe.style.position = "absolute";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    var wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = width || "100%";
    wrapper.style.paddingTop = "56.25%";
    wrapper.appendChild(iframe);

    (mount || script.parentNode).insertBefore(wrapper, mount ? null : script);
  } else {
    iframe.width = width || "640";
    iframe.height = height || "360";
    (mount || script.parentNode).insertBefore(iframe, mount ? null : script);
  }
})();
