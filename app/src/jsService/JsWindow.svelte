<script>
import windowsStore from "../lib/windowsStore"
import { getCode } from './jsService'
import { themeStore } from '../themeStore'
import { get } from 'svelte/store'

let { windowId, windowHeight, comment } = $props()

let consoleLog = $state([])
let showConsole = $state(false)
let consoleHeight = $state(150.0)

function startResize(event) {
  const startY = event.clientY
  const startHeight = consoleHeight
  
  function onMouseMove(event) {
    const newHeight = startHeight + (startY - event.clientY)
    consoleHeight = Math.min(windowHeight-70, Math.max(16, newHeight))
  }
  
  function onMouseUp() {
    window.removeEventListener('pointermove', onMouseMove)
    window.removeEventListener('pointerup', onMouseUp)
  }
  
  window.addEventListener('pointermove', onMouseMove)
  window.addEventListener('pointerup', onMouseUp)
}
let refreshId = $state(0)

let contentWindow = null
let logId = 0

let {mode, code} = getCode(comment)

function iframeAction(node) {
  const handleMessage = (event) => {
    if (event.source !== contentWindow) return
    if (event.data === "close") {
      windowsStore.close(windowId)
    } else if (event.data?.type === 'console') {
      consoleLog.push({id: ++logId, text: event.data.message})
    }
  }
  $effect(() => {
    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  })

  const handleLoad = (event) => {
    contentWindow = event.target.contentWindow
    contentWindow.postMessage({mode, code, dark: get(themeStore).isDark}, "*")
  }

  node.addEventListener("load", handleLoad)

  $effect(() => {
    contentWindow && contentWindow.postMessage({dark: $themeStore.isDark}, "*")
  })
}

/*
const iFrameSrc = `
<!DOCTYPE html>
<html>
<head>
<style>html, body { padding: 0; margin: 0; }</style>
<scri`+`pt>
window.close = () => { window.top.postMessage('close', '*') };

window.addEventListener('error', (event) => {
  const message = \`Uncaught Error: \${event.message}\n\${event.error?.stack || ''}\`;
  window.top.postMessage({ type: 'console', message: \`[error] \${message}\` }, '*');
});

window.addEventListener('unhandledrejection', (event) => {
  const message = \`Unhandled Rejection: \${event.reason}\`;
  window.top.postMessage({ type: 'console', message: \`[error] \${message}\` }, '*');
});

const originalConsole = {};
const methods = ['log', 'warn', 'error', 'info', 'debug'];
methods.forEach(method => {
  originalConsole[method] = console[method];
  console[method] = (...args) => {
    originalConsole[method](...args);
    const message = args.map(arg => {
      try {
        if (arg instanceof Error) return \`Error: \${arg.message}\\n\${arg.stack}\`;
        if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg);
        return String(arg);
      } catch (e) {
        return '[Unserializable Object]';
      }
    }).join(' ');
    window.top.postMessage({ type: 'console', message: \`[\${method}] \${message}\` }, '*');
  };
});

window.addEventListener('message', function(event) {
  const {mode, code, dark} = event.data;
  if (dark !== undefined) {
    document.body.style.color = dark ? '#fff' : '#000';
    window.dark = dark;
  }
  if (mode === 'js') {
    const s = document.createElement('script');
    s.innerHTML = code;
    document.head.appendChild(s);
  } else if (mode === 'html') {
    const doc = new DOMParser().parseFromString(code, 'text/html');
    const cloneScript = el => {
      const script = document.createElement('script');
      script.textContent = el.textContent;
      Array.from(el.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
      return script;
    };

    Array.from(doc.head.children).forEach(el => document.head.appendChild(
      el.tagName === 'SCRIPT' ? cloneScript(el) : el
    ));

    document.body.innerHTML = doc.body.innerHTML;
    Array.from(document.body.getElementsByTagName('script')).forEach(el => 
      el.parentNode.replaceChild(cloneScript(el), el)
    );
  }
}, false);
</scri`+`pt>
</head>
<body></body>
</html>`

const blob = new Blob([iFrameSrc], { type: 'text/html' })
const url = URL.createObjectURL(blob)
*/
const url = "https://empty-iframe.p273.workers.dev/"  // for origin isolation

let show = $state(true)

export async function refresh() {
  console.log($state.snapshot(comment))
  consoleLog.length = 0
  let d = getCode(comment)
  mode = d.mode
  code = d.code
  refreshId += 1
}

export async function pasteHtml(event) {  // userscript
  window._pasteHtml && window._pasteHtml({event, comment, mode, code})
}

export function toggleConsole() {
  showConsole = !showConsole
}
</script>

<div class="container">
  {#if show}
    {#key refreshId}
      <iframe title="" src={url} use:iframeAction></iframe>
    {/key}
  {/if}

  {#if showConsole}
  <div class="console-log" bind:offsetHeight={consoleHeight} style="height: {consoleHeight}px">
    <div class="resize-handle" onpointerdown={startResize}></div>
    <button class="clear-btn" onclick={() => consoleLog.length = 0}>clear</button>
    <div class="messages">
      {#each consoleLog as i (i.id)}
        <pre class:error={i.text.startsWith('[error]')}>{i.text}</pre>
      {/each}
    </div>
  </div>
  {/if}
</div>

<style>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--comment-bg-color);
}
iframe {
  flex-grow: 1;
  border: 0;
  min-height: 50px;
}
.console-log {
  position: relative;
  flex-shrink: 0;
  overflow-y: auto;
  border-top: 1px solid var(--text-color);
  background-color: var(--code-bg-color);
  color: var(--text-color);
  padding: 5px;
  font-family: monospace;
  font-size: 0.8em;
}

.resize-handle {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 1;
}

.resize-handle:hover {
  background-color: var(--text-color);
  opacity: 0.2;
}

.clear-btn {
  position: sticky;
  top: 5px;
  float: right;
  margin: 5px;
  padding: 0;
  cursor: pointer;
  z-index: 2;
  background-color: transparent;
}
.console-log pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 4px;
}

.console-log pre.error {
  color: #f00000;
}

.messages pre:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.07);
}
</style>
