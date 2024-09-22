<script>
import { onMount, tick } from 'svelte';
const inputId = Math.random().toString(36)

export let value = ''
export let obj
export let onUpdate
export let generating

let el
let elParent

onMount(() => {
	elParent.style.height = `auto`
	el.style.height = 0
	el.style.height = `${el.scrollHeight}px`
})

async function valueChanged(value) {
	if (!el) await tick();
	if (!el) return;

	const start = el.selectionStart;
	const end = el.selectionEnd;
	const direction = el.selectionDirection;
	el.value = value;
	el.setSelectionRange(start, end, direction);
}

async function autoresize(value) {
	await tick()
	if (!el) return;

	// lock parent height, to not trigger scroll
	// because of textarea shrinking temporarily
	elParent.style.height = `${el.offsetHeight}px`

	el.style.height = "auto"
	el.style.height = `${el.scrollHeight}px`

	elParent.style.height = 'auto'
}
$: {
	valueChanged(value)
	autoresize(value)
}

// TODO: fix scrolling back to input when offscreen
function onInput(event) {
	value = el.value
	obj.content = el.value
	onUpdate(obj)
}
</script>

<div bind:this={elParent}>
<textarea
	bind:this={el}
	id={`ta-${inputId}`}
	spellcheck={!generating}
	autocomplete="off"
	rows="1"
	on:input={onInput}
></textarea>
</div>

<style>
textarea {
	padding: 0 0.6em;
	margin: 0 0 5px 0;
	border-radius: 0;
	color: var(--text-color);
	display: block;
	width: 100%;
	resize: none;
	background: none;
	border: none;
}
</style>
