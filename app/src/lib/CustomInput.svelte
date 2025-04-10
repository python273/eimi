<script>
/* Custom Textarea:
- Auto-resizing to text height
- Updating value preserves cursor and selection position
    (e.g. to copy while generating)
*/
import { onMount, tick } from 'svelte'
const inputId = Math.random().toString(36)

let {
  value = '', message = $bindable(), generating, attr = 'content', ...inputProps
} = $props()

let el = $state()
let elParent = $state()

onMount(() => {
  elParent.style.height = `${el.offsetHeight}px`
  el.style.height = 0
  el.style.height = `${el.scrollHeight+2}px`
  elParent.style.height = 'auto'
})

async function valueChanged() {
  if (!el) await tick()
  if (!el) return
  if (el.value === value) return

  const start = el.selectionStart
  const end = el.selectionEnd
  const direction = el.selectionDirection
  el.value = value
  el.setSelectionRange(start, end, direction)
}

async function autoresize() {
  await tick()
  if (!el) return

  // lock parent height, to not trigger scroll
  // because of textarea shrinking temporarily
  elParent.style.height = `${el.offsetHeight}px`

  el.style.height = "auto"
  el.style.height = `${el.scrollHeight+2}px`

  elParent.style.height = 'auto'
}
$effect.pre(() => {
  value
  valueChanged()
  autoresize()
})

function onInput(event) {
  value = el.value
  message[attr] = el.value
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
    oninput={onInput}
    {...inputProps}
  ></textarea>
</div>

<style>
div {
  margin: 0 0.4em 5px 0.4em;
}
/* check changes to style don't trigger scroll flash on typing! */
textarea {
  line-height: 1.2em;
  padding: 0 0.2em;
  margin: 0;
  border-radius: 2px;
  color: var(--text-color);
  display: block;
  width: 100%;
  resize: none;
  background: none;
  border: none;
}
</style>
