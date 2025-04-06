<script>
import { refreshConfig } from "./config"

let show = $state(false)
// svelte-ignore non_reactive_update
let config

let step = $state(1)
let tokens = $state({})
let proxies = $state({})

try {
  config = JSON.parse(localStorage["cfg-config-user"])
  show = localStorage.getItem("cfg-welcome") === null && 
    Object.keys(config.apis).every(api => 
      config.apis[api].$set.token === "")
  Object.keys(config.apis).forEach((api) => {
    tokens[api] = ""
    proxies[api] = false
  })
} catch {
  show = false
}

function skip() {
  localStorage.setItem("cfg-welcome", "1")
  show = false
}

function saveTokens() {
  const config = JSON.parse(localStorage["cfg-config-user"])
  Object.keys(tokens).forEach((api) => {
    config.apis[api].$set.token = tokens[api]
    config.apis[api].$set.proxy = proxies[api]
  })
  localStorage["cfg-config-user"] = JSON.stringify(config, null, 2)
  localStorage.setItem("cfg-welcome", "1")
  refreshConfig()
  show = false
}

let dialogElement = $state()
$effect(() => {
  if (show && dialogElement) {
    dialogElement.showModal()
  } else if (dialogElement) {
    dialogElement.close()
  }
})
</script>

{#if show}
  <dialog bind:this={dialogElement}>
    {#if step === 1}
      <article>
        <button class="skip-btn" onclick={skip} title="skip">×</button>
        <h2>Welcome</h2>
        <hr/>
        <p><strong>Eimi</strong> is an open-source UI for LLMs.</p>
        <br/>
        <ul>
          <li>Threaded tree-style UI</li>
          <li>Full context control</li>
          <li>Sessions are stored locally in the browser</li>
          <li>Multi-API: OpenAI, Anthropic, OpenRouter, Google, etc.</li>
          <li>Scripts for context transformation</li>
        </ul>
        <br/>
        <p>
          <a href="https://github.com/python273/eimi"
            >https://github.com/python273/eimi</a
          >
        </p>
        <div class="dialog-buttons">
          <!-- svelte-ignore a11y_autofocus -->
          <button onclick={() => (step = 2)} type="button" autofocus>Setup</button>
        </div>
      </article>
    {:else}
      <h2>API Setup</h2>
      <div class="tokens">
        {#each Object.keys(config.apis) as api}
          <div class="token-input">
            <label for={api}>{api}</label>
            <input
              type="text"
              id={api}
              bind:value={tokens[api]}
              placeholder="API token"
              style="flex: 1;"
            />
            <label>
              <input type="checkbox" bind:checked={proxies[api]}/>
              proxy
            </label>
          </div>
        {/each}
      </div>
      <div class="dialog-buttons">
        <button onclick={saveTokens} type="button">Save</button>
      </div>
    {/if}
  </dialog>
{/if}

<style>
.skip-btn {
  position: absolute;
  right: 1em;
  top: 1em;
}
.dialog-buttons {
  margin-top: 1em;
}
.dialog-buttons button {
  width: 100%;
  border-radius: 5px;
  padding: 0.2em;
  font-weight: bold;
  background: var(--brand-color);
  color: white;
}
h2 {
  margin-top: 0;
}
.tokens {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 256px;
  overflow-y: auto;
}
.token-input {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: baseline;
}
.token-input input {
  margin: 2px;
}
li {
  margin-left: 1em;
}
</style>
