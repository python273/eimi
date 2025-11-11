<script>
import { marked } from 'marked'

let { content = "", generating = false } = $props()
let ast = $state([])
let currentContent = $state("")
let copyButtonText = $state("")

marked.setOptions({
  gfm: true,
  breaks: true,
})

const renderer = new marked.Renderer()
renderer.html = (html) => {
  return html.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

marked.use({ renderer })

function parseContent() {
  if (content === currentContent) return
  ast = marked.lexer(content)
  currentContent = content
}

$effect(() => {
  parseContent()
})

$effect(() => {
  if (!generating) {
    parseContent()
  }
})
</script>

{#snippet RenderTokens(tokens)}
  {#each tokens as token}
    {#if token.type === 'text'}
      {#if token.tokens}
        {@render RenderTokens(token.tokens)}
      {:else}
        {token.text}
      {/if}
    {:else if token.type === 'paragraph'}
      <p>{@render RenderTokens(token.tokens || [])}</p>
    {:else if token.type === 'strong'}
      <strong>{@render RenderTokens(token.tokens || [])}</strong>
    {:else if token.type === 'em'}
      <em>{@render RenderTokens(token.tokens || [])}</em>
    {:else if token.type === 'codespan'}
      <code>{token.text}</code>
    {:else if token.type === 'code'}
      <div class="code-block">
        <button class="copy-button" onclick={() => {
          navigator.clipboard.writeText(token.text)
            .then(() => { copyButtonText = 'Copied!' })
            .catch(() => { copyButtonText = 'Failed' })
            .finally(() => { setTimeout(() => { copyButtonText = '' }, 500) })
        }}>{copyButtonText} <span class="heroicons-solid--clipboard-copy"></span></button>
        <pre><code>{token.text}</code></pre>
      </div>
    {:else if token.type === 'blockquote'}
      <blockquote>{@render RenderTokens(token.tokens || [])}</blockquote>
    {:else if token.type === 'heading'}
      {#if token.depth === 1}
        <h1>{@render RenderTokens(token.tokens || [])}</h1>
      {:else if token.depth === 2}
        <h2>{@render RenderTokens(token.tokens || [])}</h2>
      {:else if token.depth === 3}
        <h3>{@render RenderTokens(token.tokens || [])}</h3>
      {:else if token.depth === 4}
        <h4>{@render RenderTokens(token.tokens || [])}</h4>
      {:else if token.depth === 5}
        <h5>{@render RenderTokens(token.tokens || [])}</h5>
      {:else if token.depth === 6}
        <h6>{@render RenderTokens(token.tokens || [])}</h6>
      {/if}
    {:else if token.type === 'list'}
      {#if token.ordered}
        <ol start={token.start}>
          {#each token.items || [] as item}<li>{@render RenderTokens(item.tokens || [])}</li>{/each}
        </ol>
      {:else}
        <ul>{#each token.items || [] as item}<li>{@render RenderTokens(item.tokens || [])}</li>{/each}</ul>
      {/if}
    {:else if token.type === 'link'}
      <a href={token.href}>{@render RenderTokens(token.tokens || [])}</a>
    {:else if token.type === 'image'}
      <img src={token.href} alt={token.text || ''} />
    {:else if token.type === 'space'}
      {' '}
    {:else if token.type === 'br'}
      <br />
    {:else if token.type === 'hr'}
      <hr />
    {:else if token.type === 'table'}
      <table>
        <thead>
          <tr>
            {#each token.header || [] as cell}
              <th align={cell.align}>{@render RenderTokens(cell.tokens || [])}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each token.rows || [] as row}
            <tr>
              {#each row || [] as cell}
                <td align={cell.align}>{@render RenderTokens(cell.tokens || [])}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if token.type === 'del'}
      <del>{@render RenderTokens(token.tokens || [])}</del>
    {:else if token.type === 'escape'}
      {token.text}
    {:else if token.type === 'html'}
      <!-- not rendering html -->
      {token.text}
    {:else if token.type === 'def'}
    {:else if token.type === 'tag'}
      <!-- not rendering html -->
      {token.text}
    {:else}
      {@debug token}
    {/if}
  {/each}
{/snippet}

<div class="markdown">
  {@render RenderTokens(ast)}
</div>

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
:global(.markdown .code-block) {
  position: relative;
  margin: 1em 0;
}
:global(.markdown .copy-button) {
  position: absolute;
  top: 0.1em;
  right: 0;
  padding: 0 .2em;
  cursor: pointer;
  opacity: .7;
}
</style>
