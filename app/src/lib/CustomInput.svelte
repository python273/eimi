<script>
/* Custom Textarea:
- Auto-resizing to text height
- Updating value preserves cursor and selection position
    (e.g. to copy while generating)
*/
import { onMount, tick } from 'svelte'
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
  if (!el) await tick()
  if (!el) return
  if (el.value === value) return

  const start = el.selectionStart
  const end = el.selectionEnd
  const direction = el.selectionDirection
  el.value = value
  el.setSelectionRange(start, end, direction)
}

async function autoresize(value) {
  await tick()
  if (!el) return

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
  placeholder="..."
  rows="1"
  on:input={onInput}
></textarea>
</div>

<style>
div {
  margin: 0 0.4em 5px 0.4em;
}
/* check changes to style don't trigger scroll flash on typing! */
textarea {
  line-height: 1.188em;
  padding: 0 0.2em;
  margin: 0;
  border-radius: 0;
  color: var(--text-color);
  display: block;
  width: 100%;
  resize: none;
  background: none;
  border: none;
}
</style>
