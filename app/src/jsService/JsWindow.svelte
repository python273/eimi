<script>
import { onDestroy } from 'svelte';
import windowsStore from "../lib/windowsStore";

export let windowId;
export let mode;
export let code;

const cleanupWindowHandlers = [];

function handleIframeLoad(event) {
	const fw = event.target.contentWindow;
	const messageHandler = (event) => {
		if (event.source !== fw) return;
		if (event.data === "close") {
			windowsStore.close(windowId);
		}
	};
	window.addEventListener("message", messageHandler);
	cleanupWindowHandlers.push(messageHandler);
	fw.postMessage({ mode: mode, code: code }, "*");
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
  const {mode, code} = event.data;
  if (mode === 'js') {
    const s = document.createElement('script');
    s.innerHTML = code;
    document.head.appendChild(s);
  } else if (mode === 'html') {
    document.body.innerHTML = code;
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
</script>

<iframe title="" src={url} on:load={(e) => handleIframeLoad(e)}></iframe>

<style>
iframe {
	width: 100%;
	height: 100%;
	border: 0;
	background: white;
}
</style>