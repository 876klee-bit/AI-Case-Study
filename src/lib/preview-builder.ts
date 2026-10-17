import type { ArtifactType } from '@/types';
import { previewRuntime } from './artifact-meta';

/**
 * Builds the srcdoc for the sandboxed preview iframe. The iframe has an opaque origin
 * (no allow-same-origin), so nothing here can reach the parent page, its cookies or storage.
 * It talks back only through postMessage: errors, and CSV edits from the spreadsheet grid.
 */

const CDN = {
  react: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  babel: 'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js',
  lucide: 'https://unpkg.com/lucide-react@0.468.0/dist/umd/lucide-react.min.js',
  tailwind: 'https://cdn.tailwindcss.com',
  marked: 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
};

/** JSON-encode a string so it can sit safely inside a <script> tag. */
function embed(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .split(String.fromCharCode(0x2028))
    .join('\\u2028')
    .split(String.fromCharCode(0x2029))
    .join('\\u2029');
}

const ERROR_BRIDGE = `
<script>
  (function () {
    function send(message) {
      try { parent.postMessage({ source: 'workspace-preview', type: 'error', message: String(message) }, '*'); } catch (e) {}
    }
    window.__previewError = function (message) {
      send(message);
      var el = document.getElementById('__preview_error');
      if (!el) {
        el = document.createElement('pre');
        el.id = '__preview_error';
        el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;max-height:45%;overflow:auto;margin:0;padding:12px 14px;border-radius:10px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;z-index:2147483647;box-shadow:0 8px 24px -8px rgba(0,0,0,.2)';
        document.body.appendChild(el);
      }
      el.textContent = String(message);
    };
    window.addEventListener('error', function (e) { window.__previewError(e.message || 'Script error'); });
    window.addEventListener('unhandledrejection', function (e) { window.__previewError((e.reason && e.reason.message) || String(e.reason)); });
  })();
</script>`;

const BASE_STYLE = `
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
</style>`;

function shell(head: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${ERROR_BRIDGE}
${head}
</head>
<body>
${body}
</body>
</html>`;
}

function buildReact(code: string): string {
  const head = `
${BASE_STYLE}
<script src="${CDN.tailwind}"></script>
<script crossorigin src="${CDN.react}"></script>
<script crossorigin src="${CDN.reactDom}"></script>
<script>window.react = window.React;</script>
<script crossorigin src="${CDN.lucide}"></script>
<script src="${CDN.babel}"></script>`;

  const body = `
<div id="root"></div>
<script>
(function () {
  var source = ${embed(code)};
  var React = window.React;
  var ReactDOM = window.ReactDOM;

  function Fallback(props) {
    return React.createElement('span', {
      style: { display: 'inline-block', width: props.size || 24, height: props.size || 24, borderRadius: 4, background: 'currentColor', opacity: 0.2 },
      className: props.className
    });
  }
  var lucide = new Proxy(window.LucideReact || {}, {
    get: function (target, key) {
      if (key === '__esModule') return true;
      if (key in target) return target[key];
      return Fallback;
    }
  });

  var routerState = { path: '/' };
  var listeners = [];
  function navigate(to) {
    routerState.path = typeof to === 'string' ? to : (to && to.pathname) || '/';
    listeners.forEach(function (fn) { fn(routerState.path); });
  }
  function usePathname() {
    var s = React.useState(routerState.path);
    React.useEffect(function () {
      var fn = function (p) { s[1](p); };
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (l) { return l !== fn; }); };
    }, []);
    return s[0];
  }
  var Link = React.forwardRef(function (props, ref) {
    var href = typeof props.href === 'string' ? props.href : (props.href && props.href.pathname) || '#';
    var rest = Object.assign({}, props);
    delete rest.href; delete rest.prefetch; delete rest.replace; delete rest.scroll; delete rest.legacyBehavior; delete rest.passHref;
    return React.createElement('a', Object.assign({}, rest, {
      ref: ref,
      href: href,
      onClick: function (e) {
        if (props.onClick) props.onClick(e);
        if (e.defaultPrevented) return;
        if (/^https?:/.test(href) || href.charAt(0) === '#') return;
        e.preventDefault();
        navigate(href);
      }
    }));
  });
  function NextImage(props) {
    var rest = Object.assign({}, props);
    var src = typeof props.src === 'string' ? props.src : (props.src && props.src.src) || '';
    delete rest.fill; delete rest.priority; delete rest.quality; delete rest.placeholder; delete rest.blurDataURL; delete rest.loader; delete rest.unoptimized;
    var style = Object.assign({}, props.style || {}, props.fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : {});
    return React.createElement('img', Object.assign({}, rest, { src: src, style: style }));
  }
  var nextNavigation = {
    useRouter: function () {
      return { push: navigate, replace: navigate, back: function () {}, forward: function () {}, refresh: function () {}, prefetch: function () {} };
    },
    usePathname: usePathname,
    useSearchParams: function () { return new URLSearchParams(''); },
    useParams: function () { return {}; },
    redirect: navigate,
    notFound: function () { throw new Error('notFound() called'); }
  };

  var modules = {
    'react': React,
    'react-dom': ReactDOM,
    'react-dom/client': ReactDOM,
    'react/jsx-runtime': { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment },
    'lucide-react': lucide,
    'next/link': { __esModule: true, default: Link },
    'next/image': { __esModule: true, default: NextImage },
    'next/navigation': nextNavigation,
    'next/router': { useRouter: nextNavigation.useRouter }
  };
  function requireShim(name) {
    if (name in modules) {
      var m = modules[name];
      if (name === 'react' || name === 'react-dom' || name === 'react-dom/client') {
        return Object.assign({ __esModule: true, default: m }, m);
      }
      return m;
    }
    if (/\\.css$/.test(name)) return {};
    throw new Error('Module "' + name + '" is not available in the preview. Use react, lucide-react or next/* only.');
  }

  try {
    if (!window.Babel) throw new Error('The preview runtime could not load. Check your connection and reload.');
    var cleaned = source.replace(/^\\s*['"]use (client|server)['"];?\\s*$/m, '');
    var out = window.Babel.transform(cleaned, {
      filename: 'App.tsx',
      presets: [['typescript', { isTSX: true, allExtensions: true }], ['react', { runtime: 'classic' }]],
      plugins: ['transform-modules-commonjs']
    }).code;
    var module = { exports: {} };
    new Function('require', 'module', 'exports', 'React', out)(requireShim, module, module.exports, React);
    var exp = module.exports;
    var Component = exp.default || exp.App || exp.Page || exp.Dashboard ||
      Object.keys(exp).map(function (k) { return exp[k]; }).find(function (v) { return typeof v === 'function'; });
    if (!Component) throw new Error('No component found. Add "export default function App() { ... }".');

    var ErrorBoundary = (function () {
      function EB(props) { React.Component.call(this, props); this.state = { error: null }; }
      EB.prototype = Object.create(React.Component.prototype);
      EB.prototype.constructor = EB;
      EB.getDerivedStateFromError = function (error) { return { error: error }; };
      EB.prototype.componentDidCatch = function (error) { window.__previewError(error && error.message ? error.message : String(error)); };
      EB.prototype.render = function () { return this.state.error ? null : this.props.children; };
      return EB;
    })();

    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(ErrorBoundary, null, React.createElement(Component))
    );
  } catch (err) {
    window.__previewError(err && err.message ? err.message : String(err));
  }
})();
</script>`;
  return shell(head, body);
}

function buildHtml(code: string): string {
  const isDocument = /<html[\s>]/i.test(code) || /<!doctype/i.test(code);
  if (isDocument) {
    // Inject the error bridge right after <head> so runtime errors still surface.
    if (/<head[^>]*>/i.test(code)) return code.replace(/<head[^>]*>/i, (m) => `${m}\n${ERROR_BRIDGE}`);
    return code.replace(/<html[^>]*>/i, (m) => `${m}<head>${ERROR_BRIDGE}</head>`);
  }
  return shell(`${BASE_STYLE}<script src="${CDN.tailwind}"></script>`, code);
}

const PROSE_STYLE = `
<style>
  :root { color-scheme: light; }
  body { background: #fff; color: #1c1917; }
  .prose { max-width: 760px; margin: 0 auto; padding: 48px 32px 96px; font-size: 16px; line-height: 1.7; }
  .prose h1 { font-size: 2.1em; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 .6em; }
  .prose h2 { font-size: 1.45em; line-height: 1.3; letter-spacing: -0.01em; margin: 1.8em 0 .6em; padding-bottom: .3em; border-bottom: 1px solid #e7e5e4; }
  .prose h3 { font-size: 1.15em; margin: 1.5em 0 .5em; }
  .prose p, .prose ul, .prose ol, .prose blockquote, .prose pre, .prose table { margin: 0 0 1.1em; }
  .prose a { color: #b45309; }
  .prose blockquote { border-left: 3px solid #d6d3d1; padding: .2em 0 .2em 1em; color: #57534e; }
  .prose code { font: .88em ui-monospace, SFMono-Regular, Menlo, monospace; background: #f5f5f4; padding: .15em .35em; border-radius: 5px; }
  .prose pre { background: #1c1917; color: #f5f5f4; padding: 14px 16px; border-radius: 10px; overflow: auto; }
  .prose pre code { background: none; padding: 0; color: inherit; }
  .prose table { border-collapse: collapse; width: 100%; font-size: .94em; }
  .prose th, .prose td { border: 1px solid #e7e5e4; padding: 8px 10px; text-align: left; }
  .prose th { background: #fafaf9; font-weight: 600; }
  .prose img { max-width: 100%; border-radius: 8px; }
  .prose hr { border: 0; border-top: 1px solid #e7e5e4; margin: 2em 0; }
</style>`;

function buildMarkdown(code: string): string {
  const head = `${BASE_STYLE}${PROSE_STYLE}<script src="${CDN.marked}"></script>`;
  const body = `
<article class="prose" id="doc"></article>
<script>
  try {
    if (!window.marked) throw new Error('The Markdown renderer could not load. Check your connection and reload.');
    document.getElementById('doc').innerHTML = window.marked.parse(${embed(code)}, { gfm: true });
  } catch (err) { window.__previewError(err.message || String(err)); }
</script>`;
  return shell(head, body);
}

function buildSlides(code: string): string {
  const head = `${BASE_STYLE}${PROSE_STYLE}<script src="${CDN.marked}"></script>
<style>
  html, body { height: 100%; background: #1c1917; overflow: hidden; }
  .stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px 24px 72px; box-sizing: border-box; }
  .slide { width: min(100%, calc((100vh - 96px) * 16 / 9)); aspect-ratio: 16 / 9; background: #fff; border-radius: 14px; box-shadow: 0 20px 50px -20px rgba(0,0,0,.6); overflow: hidden; display: flex; }
  .slide .prose { margin: auto; width: 100%; max-width: none; padding: 6% 8%; box-sizing: border-box; font-size: clamp(12px, 2.1vw, 22px); }
  .slide .prose h1 { font-size: 2.4em; border: 0; }
  .slide .prose h2 { border: 0; font-size: 1.7em; margin-top: 0; }
  .slide.title .prose { text-align: center; }
  .bar { position: absolute; left: 0; right: 0; bottom: 16px; display: flex; justify-content: center; align-items: center; gap: 12px; color: #e7e5e4; font: 13px/1 Inter, system-ui, sans-serif; }
  .bar button { all: unset; cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: rgba(255,255,255,.08); }
  .bar button:hover { background: rgba(255,255,255,.16); }
  .bar button:disabled { opacity: .35; cursor: default; }
  .progress { position: absolute; left: 0; top: 0; height: 3px; background: #f59e0b; transition: width .25s ease; }
</style>`;
  const body = `
<div class="progress" id="progress"></div>
<div class="stage"><div class="slide" id="slide"><div class="prose" id="content"></div></div></div>
<div class="bar">
  <button id="prev" aria-label="Previous slide">&#8592;</button>
  <span id="counter"></span>
  <button id="next" aria-label="Next slide">&#8594;</button>
</div>
<script>
  (function () {
    try {
      if (!window.marked) throw new Error('The Markdown renderer could not load. Check your connection and reload.');
      var slides = ${embed(code)}.split(/^\\s*---\\s*$/m).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!slides.length) slides = ['# Empty presentation'];
      var i = 0;
      var slideEl = document.getElementById('slide');
      function render() {
        var md = slides[i];
        document.getElementById('content').innerHTML = window.marked.parse(md, { gfm: true });
        slideEl.className = 'slide' + (/^#\\s/.test(md) && md.split('\\n').filter(Boolean).length <= 3 ? ' title' : '');
        document.getElementById('counter').textContent = (i + 1) + ' / ' + slides.length;
        document.getElementById('prev').disabled = i === 0;
        document.getElementById('next').disabled = i === slides.length - 1;
        document.getElementById('progress').style.width = ((i + 1) / slides.length * 100) + '%';
      }
      function go(d) { i = Math.max(0, Math.min(slides.length - 1, i + d)); render(); }
      document.getElementById('prev').onclick = function () { go(-1); };
      document.getElementById('next').onclick = function () { go(1); };
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
        if (e.key === 'Home') { i = 0; render(); }
        if (e.key === 'End') { i = slides.length - 1; render(); }
      });
      render();
    } catch (err) { window.__previewError(err.message || String(err)); }
  })();
</script>`;
  return shell(head, body);
}

function buildCsv(code: string): string {
  const head = `${BASE_STYLE}
<style>
  body { background: #fff; color: #1c1917; font-size: 13px; }
  .wrap { overflow: auto; height: 100vh; }
  table { border-collapse: separate; border-spacing: 0; min-width: 100%; }
  th, td { border-right: 1px solid #e7e5e4; border-bottom: 1px solid #e7e5e4; padding: 0; height: 30px; white-space: nowrap; }
  thead th { position: sticky; top: 0; z-index: 2; background: #fafaf9; color: #78716c; font-weight: 500; font-size: 11px; text-align: center; min-width: 110px; }
  tbody th { position: sticky; left: 0; z-index: 1; background: #fafaf9; color: #78716c; font-weight: 500; font-size: 11px; width: 44px; min-width: 44px; text-align: center; }
  thead th.corner { left: 0; z-index: 3; min-width: 44px; width: 44px; }
  td div { padding: 6px 10px; outline: none; min-height: 18px; }
  td div:focus { box-shadow: inset 0 0 0 2px #f59e0b; background: #fffbeb; }
  tr.header td { font-weight: 600; background: #fafaf9; }
  td.num div { text-align: right; font-variant-numeric: tabular-nums; }
</style>`;
  const body = `
<div class="wrap"><table id="grid"></table></div>
<script>
  (function () {
    function parse(text) {
      var rows = [], row = [], cell = '', q = false;
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (q) {
          if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
          else if (c === '"') q = false;
          else cell += c;
        } else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\\n' || c === '\\r') {
          if (c === '\\r' && text[i + 1] === '\\n') i++;
          row.push(cell); rows.push(row); row = []; cell = '';
        } else cell += c;
      }
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
      return rows;
    }
    function quote(v) { return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    function col(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

    var data = parse(${embed(code)}.replace(/\\s+$/, ''));
    var width = Math.max(1, data.reduce(function (m, r) { return Math.max(m, r.length); }, 0));
    var table = document.getElementById('grid');
    var thead = '<thead><tr><th class="corner"></th>';
    for (var c = 0; c < width; c++) thead += '<th>' + col(c) + '</th>';
    table.innerHTML = thead + '</tr></thead>';
    var tbody = document.createElement('tbody');
    data.forEach(function (r, ri) {
      var tr = document.createElement('tr');
      if (ri === 0) tr.className = 'header';
      var th = document.createElement('th'); th.textContent = ri + 1; tr.appendChild(th);
      for (var ci = 0; ci < width; ci++) {
        var td = document.createElement('td');
        var v = r[ci] == null ? '' : r[ci];
        if (ri > 0 && v !== '' && !isNaN(Number(v.replace(/[$,%]/g, '')))) td.className = 'num';
        var div = document.createElement('div');
        div.contentEditable = 'true';
        div.spellcheck = false;
        div.textContent = v;
        div.dataset.r = ri; div.dataset.c = ci;
        td.appendChild(div); tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    var timer = null;
    tbody.addEventListener('input', function (e) {
      var t = e.target;
      var r = Number(t.dataset.r), c = Number(t.dataset.c);
      while (data[r].length <= c) data[r].push('');
      data[r][c] = t.textContent;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var csv = data.map(function (row) { return row.map(quote).join(','); }).join('\\n') + '\\n';
        parent.postMessage({ source: 'workspace-preview', type: 'csv', csv: csv }, '*');
      }, 400);
    });
    tbody.addEventListener('keydown', function (e) {
      var t = e.target;
      if (!t.dataset) return;
      var r = Number(t.dataset.r), c = Number(t.dataset.c), next = null;
      if (e.key === 'Enter' || e.key === 'ArrowDown') next = [r + 1, c];
      else if (e.key === 'ArrowUp') next = [r - 1, c];
      else if (e.key === 'Tab') next = [r, c + (e.shiftKey ? -1 : 1)];
      if (!next) return;
      var el = tbody.querySelector('div[data-r="' + next[0] + '"][data-c="' + next[1] + '"]');
      if (el) { e.preventDefault(); el.focus(); }
    });
  })();
</script>`;
  return shell(head, body);
}

export function buildPreviewDocument(type: ArtifactType, code: string): string {
  switch (previewRuntime(type, code)) {
    case 'react':
      return buildReact(code);
    case 'html':
      return buildHtml(code);
    case 'markdown':
      return buildMarkdown(code);
    case 'slides':
      return buildSlides(code);
    case 'csv':
      return buildCsv(code);
  }
}

export const PREVIEW_SANDBOX = 'allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads';
