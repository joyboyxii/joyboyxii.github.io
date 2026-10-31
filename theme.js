/* Runs in <head> before paint: the site starts in dark (Twilight) mode unless the visitor switched to light. */
(function () {
  try {
    var t = localStorage.getItem("chron.theme");
    var dark = t ? JSON.parse(t) !== "light" : true;   // dark by default; light only if the visitor chose it
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) { document.documentElement.classList.add("dark"); }
  /* start fetching the title-screen art for this theme right away (rim light + colour grade are baked into each version) */
  try {
    var l = document.createElement("link"); l.rel = "preload"; l.as = "image"; l.setAttribute("fetchpriority", "high");
    l.href = "assets/images/brandon-art-" + (document.documentElement.classList.contains("dark") ? "dark" : "light") + ".webp";
    document.head.appendChild(l);
  } catch (e) {}
})();
