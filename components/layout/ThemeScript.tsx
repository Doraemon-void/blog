/**
 * Pre-paint theme resolution.
 *
 * This is a blocking inline script on purpose. Any deferred approach — a React
 * effect, a `useEffect` in the provider, a theme library — resolves the theme
 * one frame after first paint, which produces a white flash for dark-mode
 * readers on every navigation. A few hundred bytes of synchronous script in
 * `<head>` is the only way to avoid that.
 *
 * Order of precedence matches the toggle: an explicit choice in localStorage
 * wins, otherwise the OS preference is used.
 *
 * Wrapped in try/catch because localStorage throws in some privacy modes, and
 * a thrown error here would blank the page.
 */

const THEME_SCRIPT = `(function(){try{
var stored=localStorage.getItem('theme');
var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
var root=document.documentElement;
if(dark){root.classList.add('dark');}
root.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      // The content is a fixed literal above — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
