<script>
import { onMount } from "svelte";
import jsServiceStore from "./jsServiceStore.js";
import Portal from "../lib/Portal.svelte";

let isDragging = false
let previousX = 0
let previousY = 0
let draggingWindowId = null
let overlay;

function closeWindow(id) {
	jsServiceStore.removeIframe(id);
}

function handleIframeLoad(event, iframe) {
	const fw = event.target.contentWindow;
	const messageHandler = (event) => {
		if (event.source !== fw) return;
		if (event.data === "close") {
			closeWindow(iframe.id);
		}
	};

	window.addEventListener("message", messageHandler);
	fw.postMessage({ mode: iframe.mode, code: iframe.code }, "*");

	// TODO: fix it
	return () => {
		window.removeEventListener("message", messageHandler);
	};
}

function handleMouseDown(event, id) {
	if (event.target !== event.currentTarget) return;
	isDragging = true
	previousX = event.clientX
	previousY = event.clientY
	draggingWindowId = id

	overlay = document.createElement("div");
	Object.assign(overlay.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		zIndex: "9999",
		cursor: "move",
	});
	document.body.appendChild(overlay);
}

function handleMouseUp() {
	if (!isDragging) return;
	isDragging = false
	previousX = 0
	previousY = 0
	draggingWindowId = null

	if (overlay) {
		overlay.remove();
		overlay = null;
	}
}

function handleMouseMove(event) {
	if (!isDragging) return;
	event.preventDefault();
	const container = document.getElementById(`iframejs-${draggingWindowId}`);
	if (!container) return;

	const deltaX = event.clientX - previousX;
	const deltaY = event.clientY - previousY;
	let newLeft = container.offsetLeft + deltaX;
	let newTop = container.offsetTop + deltaY;

	// newLeft = Math.max(newLeft, 0);
	newTop = Math.max(newTop, 0);
	// newLeft = Math.min(newLeft, window.innerWidth - container.offsetWidth);
	// newTop = Math.min(newTop, window.innerHeight - container.offsetHeight);

	// TODO: save in the store to be able to update?
	container.style.left = `${newLeft}px`;
	container.style.top = `${newTop}px`;
	previousX = event.clientX
	previousY = event.clientY
}

onMount(() => {
	const mouseMoveHandler = (event) => handleMouseMove(event);
	const mouseUpHandler = () => handleMouseUp();

	document.addEventListener("mousemove", mouseMoveHandler);
	document.addEventListener("mouseup", mouseUpHandler);

	return () => {
		document.removeEventListener("mousemove", mouseMoveHandler);
		document.removeEventListener("mouseup", mouseUpHandler);
	};
});
</script>

<Portal>
	{#each $jsServiceStore as iframe (iframe.id)}
		<div id="iframejs-{iframe.id}" class="container">
			<div class="header" on:mousedown={(e) => handleMouseDown(e, iframe.id)}>
				<button on:click={() => closeWindow(iframe.id)}>x</button>
			</div>
			<iframe
				title=""
				src="https://empty-iframe.p273.workers.dev/"
				on:load={(e) => handleIframeLoad(e, iframe)}
			></iframe>
		</div>
	{/each}
</Portal>

<style>
.container {
	position: fixed;
	top: 0px;
	left: 0px;
	background: rgb(255, 255, 255);
	display: flex;
	flex-direction: column;
	resize: both;
	overflow: auto;
	width: 512px;
	height: 512px;
	border: 1px solid var(--text-color);
	border-radius: 5px;
}

.header {
	background-color: var(--comment-bg-color);
	border-bottom: 1px solid var(--text-color);
	user-select: none;
	font-size: 0.8em;
	padding-left: 3px;
}

iframe {
	width: 100%;
	height: 100%;
	border: 0;
}
</style>