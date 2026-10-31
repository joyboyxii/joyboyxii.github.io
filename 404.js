/* 404 page: show which address was requested */
(() => {
  const p = document.getElementById("path");
  if (p) p.textContent = decodeURIComponent(location.pathname + location.search).slice(0, 80) || "/";
})();
