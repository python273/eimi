<script>
import { tick, onDestroy } from 'svelte';
import windowsStore from "../lib/windowsStore";
import { getCode } from './jsService';
import { themeStore } from '../themeStore';
import { get } from 'svelte/store';

export let windowId;
export let comment;
let contentWindow;

let {mode, code} = getCode(comment);

const cleanupWindowHandlers = [];

function handleIframeLoad(event) {
	contentWindow = event.target.contentWindow;
	const messageHandler = (event) => {
		if (event.source !== contentWindow) return;
		if (event.data === "close") {
			windowsStore.close(windowId);
		}
	};
	window.addEventListener("message", messageHandler);
	cleanupWindowHandlers.push(messageHandler);
	contentWindow.postMessage({mode, code, dark: get(themeStore)}, "*");
}

$: {
	contentWindow && contentWindow.postMessage({dark: $themeStore}, "*");
}

onDestroy(() => {
	for (const handler of cleanupWindowHandlers) {
		window.removeEventListener("message", handler);
	}
});

/*
const iFrameSrc = `
<!DOCTYPE html>
<html>
<head>
<style>html, body { padding: 0; margin: 0; }</style>
<scri`+`pt>
window.close = () => { window.top.postMessage('close', '*') };
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
</html>`;

const blob = new Blob([iFrameSrc], { type: 'text/html' });
const url = URL.createObjectURL(blob);
*/
const url = "https://empty-iframe.p273.workers.dev/";  // for origin isolation

let show = true;

export async function refresh() {
	console.log(comment);
	let d = getCode(comment);
	mode = d.mode;
	code = d.code;
	show = false;
	await tick();
	show = true;
}
</script>

{#if show}
	<iframe title="" src={url} on:load={(e) => handleIframeLoad(e)}></iframe>
{/if}

<style>
iframe {
	width: 100%;
	height: 100%;
	border: 0;
	background: var(--comment-bg-color);
}
</style>
