/* Build-derived from the HISAAB storage namespace. Only reads the theme preference. */
(() => {
  const rotatingEdition = function rotatingEdition(at = Date.now()) {
	return [
		"light",
		"dark",
		"classic"
	][(Math.floor((Number.isFinite(at) ? at : 0) / 864e5) % 3 + 3) % 3];
};
  try {
    const theme = localStorage.getItem("hisaab-online-theme");
    if (theme === 'light' || theme === 'dark' || theme === 'classic' || theme === 'rotate') {
      document.documentElement.dataset.theme = theme === 'rotate' ? rotatingEdition() : theme;
      document.documentElement.dataset.themePref = theme;
    }
  } catch { /* Blocked storage and system preference use the CSS/device fallback. */ }
})();
