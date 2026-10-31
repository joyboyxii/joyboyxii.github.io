/* Runs in <head> before paint so Twilight mode never flashes light first. */
(function () {
  try {
    var t = localStorage.getItem("chron.theme");
    var dark = t ? JSON.parse(t) === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
  /* start fetching the title-screen art for this theme right away (rim light + colour grade are baked into each version) */
  try {
    var l = document.createElement("link"); l.rel = "preload"; l.as = "image"; l.setAttribute("fetchpriority", "high");
    l.href = "assets/images/brandon-art-" + (document.documentElement.classList.contains("dark") ? "dark" : "light") + ".webp";
    document.head.appendChild(l);
  } catch (e) {}
})();
