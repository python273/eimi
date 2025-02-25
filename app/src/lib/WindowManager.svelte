<script>
import { onMount } from "svelte";
import Portal from "./Portal.svelte";

export let store;
const instances = {};

let isDragging = false;
let previousX = 0;
let previousY = 0;
let draggingWindowId = null;
let overlay;
let windowLastZIndex = 9999;

const getElById = (i) => `window-${i}`;

function closeWindow(id) {
	store.update((windows) => windows.filter((w) => w.id !== id));
}

function updateZIndex(id) {
    const container = document.getElementById(getElById(id));
    if (container) {
        container.style.zIndex = `${windowLastZIndex++}`;
    }
}

function handleMouseDown(event, id) {
	if (event.target !== event.currentTarget) return;
	isDragging = true;
	previousX = event.clientX;
	previousY = event.clientY;
	draggingWindowId = id;

	overlay = document.createElement("div");
	Object.assign(overlay.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		zIndex: "999999",
		cursor: "move",
	});
	document.body.appendChild(overlay);
}

function handleMouseUp() {
	if (!isDragging) return;
	isDragging = false;
	previousX = 0;
	previousY = 0;
	draggingWindowId = null;

	if (overlay) {
		overlay.remove();
		overlay = null;
	}
}

function handleMouseMove(event) {
	if (!isDragging) return;
	event.preventDefault();
	const container = document.getElementById(getElById(draggingWindowId));
	if (!container) return;

	const deltaX = event.clientX - previousX;
	const deltaY = event.clientY - previousY;
	let newLeft = container.offsetLeft + deltaX;
	let newTop = container.offsetTop + deltaY;

	newTop = Math.max(newTop, 0);

	previousX = event.clientX;
	previousY = event.clientY;
	store.updateById(draggingWindowId, {left: newLeft, top: newTop});
}

onMount(() => {
	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseup", handleMouseUp);

	return () => {
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	};
});
</script>

<Portal>
	{#each $store as w (w.id)}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			id={getElById(w.id)}
			class="window"
			on:mousedown={() => updateZIndex(w.id)}
			style="left: {w.left}px; top: {w.top}px;"
		>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="header"
				on:mousedown={(e) => handleMouseDown(e, w.id)}
			>
				<button on:click={() => closeWindow(w.id)}>x</button>
				{#each w.buttons as button}
					<button on:click={instances[w.id][button.methodName]}>
						{button.label}
					</button>
				{/each}
				{w.title}
			</div>
			<svelte:component
				this={w.component}
				bind:this={instances[w.id]}
				windowId={w.id}
				{...w.data}
			/>
		</div>
	{/each}
</Portal>

<style>
.window {
	position: fixed;
	top: 0px;
	left: 0px;
	background: var(--panel-bg-color);
	display: flex;
	flex-direction: column;
	resize: both;
	overflow: auto;
	width: 512px;
	height: 512px;
	border: 1px solid var(--text-color);
	border-radius: 5px;
	box-shadow: 0px 1px 6px #00000047;
}

.header {
	background-color: var(--panel-bg-color);
	user-select: none;
	font-size: 0.8em;
	padding-left: 3px;
}
</style>
