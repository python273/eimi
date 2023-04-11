<script>
import { onMount } from 'svelte';
const inputId = Math.random().toString(36)

export let value = ''
export let obj
export let onUpdate

let el
let elParent

onMount(() => {
	elParent.style.height = `auto`
	el.style.height = 0
	el.style.height = `${el.scrollHeight} px`
})

$: {
	value
	if (el) {
		// lock parent height, to not trigger scroll
		// because of textarea shrinking temporarily
		elParent.style.height = `${el.offsetHeight}px`

		el.style.height = "auto"
		el.style.height = `calc(${el.scrollHeight}px + 1.1em)`

		elParent.style.height = `auto`
	}
}
function handle(event) {
	obj.content = value
	onUpdate(obj)
}
</script>

<div bind:this={elParent}>
<textarea
	id={`ta-${inputId}`}
	autocomplete="off"
	rows="1"
	bind:value={value}
	on:input={handle}
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
