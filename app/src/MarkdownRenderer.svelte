<script>
import { marked } from 'marked'
import { onMount } from "svelte"

let { content = "", generating = false } = $props()
let element = $state()
let currentContent = $state("")

marked.setOptions({
  gfm: true,
  breaks: true,
})

const renderer = new marked.Renderer()
renderer.html = (html) => {
  //console.log(html);
  return html.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

marked.use({ renderer })

function renderContent() {
  if (content === currentContent) return
  element.innerHTML = marked.parse(content)
  currentContent = content
}

$effect(() => {
  if (element) {
    renderContent()
  }
})

$effect(() => {
  if (!generating && element) {
    renderContent()
  }
})

onMount(() => {
  renderContent()
})
</script>

<div class="markdown" bind:this={element}></div>

<style>
div {
  margin: 0 0.6em 5px 0.6em;
  min-height: 1em;
}
.markdown {
  word-break: break-word;
  padding: 0.1em 0;
  line-height: 1.2em;
}
:global(.markdown > *:first-child) {
  margin-block-start: 0;
}
:global(.markdown > *:last-child) {
  margin-block-end: 0;
}
:global(.markdown p, dl) {
  display: block;
  margin-block-start: 1.188em;
  margin-block-end: 1.188em;
}
:global(.markdown :not(pre) > code) {
  white-space: pre-wrap;
  border-radius: 3px;
  background-color: var(--code-bg-color);
}
:global(.markdown blockquote) {
  margin: 0;
  background-color: rgba(0, 0, 0, 0.07);
  border-left: 4px solid var(--text-color);
  /* padding: 0.3em 0 0.3em 0.5em; */
  padding: 0.0em 0 0.0em 0.5em;
  border-radius: 2px;
}
:global(.markdown pre) {
  white-space: pre-wrap;
  border-radius: 3px;
  background-color: var(--code-bg-color);
  font-size: 0.95em;
  line-height: 1.15;
  padding: 1px;
}
:global(.markdown pre, .markdown code) {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
:global(.markdown ol, .markdown ul) {
  padding-left: 1.5em;
}
:global(.markdown li) {
  word-break: break-word;
}
:global(.markdown img) {
  max-width: 100%;
}
:global(
  .markdown h1,
  .markdown h2,
  .markdown h3,
  .markdown h4,
  .markdown h5,
  .markdown h6) {
  border-left: 3px solid var(--text-color);
  padding-left: 0.5em;
  font-weight: 500;
  margin: 0.5em 0;
}
</style>
