<script>
import { onMount, tick } from 'svelte';
const inputId = Math.random().toString(36)

export let value = ''
export let obj
export let onUpdate
export let onSubmit

let el
let elParent

onMount(() => {
	elParent.style.height = `auto`
	el.style.height = 0
	el.style.height = `${el.scrollHeight} px`
})

async function autoresize(value) {
	await tick()

	if (!el) { return; }

	// lock parent height, to not trigger scroll
	// because of textarea shrinking temporarily
	elParent.style.height = `${el.offsetHeight}px`

	el.style.height = "auto"
	el.style.height = `calc(${el.scrollHeight}px)`

	elParent.style.height = `auto`
}
$: { autoresize(value) }

function handle(event) {
	obj.content = value
	onUpdate(obj)
}
function onkeydown(event) {
	if ((event.metaKey || event.ctrlKey) && event.code === "Enter") {
		event.preventDefault();
		onSubmit(event);
	}
}
</script>

<div bind:this={elParent}>
<textarea
	id={`ta-${inputId}`}
	autocomplete="off"
	rows="1"
	bind:value={value}
	on:input={handle}
	on:keydown={onkeydown}
	bind:this={el}
></textarea>
</div>

<style>
textarea {
	color: var(--text-color);
	display: block;
	width: 100%;
	resize: none;
	background: none;
	border: none;
}
</style>
