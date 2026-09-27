/* Build-derived from the HISAAB storage namespace. Only reads the theme preference. */
(() => {
  try {
    const theme = localStorage.getItem("hisaab-online-theme");
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  } catch { /* Blocked storage and system preference use the CSS/device fallback. */ }
})();
