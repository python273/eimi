<script>
import { db } from "../db"
import { notifyDbScripts, uniqueId } from "../utils"
import ScriptEditorWindow from "./ScriptEditorWindow.svelte"
import windowsStore from "./windowsStore"
import { CONFIG, configUpdated } from '../config.svelte'
import { favoriteModels } from './favoriteModelsStore'

let {sessionId, parameters, scripts, onUpdate} = $props()

// TODO: proper ids instead of api + id
const MODELS = CONFIG.models || []
let model = $state(MODELS.find(i => (i.api === parameters._api && i.id === parameters.model)) || $favoriteModels[0] || MODELS[0])

$effect(() => {
  const handler = () => {
    model = $favoriteModels[0] || MODELS.find(i => CONFIG.apis[i.api]?.token) || MODELS[0]
  }
  window.addEventListener('welcome-finished', handler)
  return () => window.removeEventListener('welcome-finished', handler)
})
let modelMaxToken = $derived(model['max_tokens'] || 32768)

let temperature = $state(parameters.temperature ?? 0.0)
let top_p = $state(parameters.top_p ?? 1.0)
let frequency_penalty = $state(parameters.frequency_penalty ?? 0.0)
let presence_penalty = $state(parameters.presence_penalty ?? 0.0)
let max_tokens = $state(parameters.max_tokens ?? 0)

let scriptsEnabled = $state(parameters.scriptsEnabled || [])

$effect(() => {
  if (max_tokens > modelMaxToken) {
    max_tokens = modelMaxToken
  }
  onUpdate({
    _api: model.api,
    model: model.id,
    temperature, frequency_penalty, presence_penalty,
    max_tokens,
    scriptsEnabled,
  })
})

function toggleScript(id) {
  if (scriptsEnabled.includes(id)) {
    scriptsEnabled = scriptsEnabled.filter(i => i != id)
  } else {
    scriptsEnabled = [...scriptsEnabled, id]
  }
}

async function createScript(event) {
  event.preventDefault()
  const newScript = {
    id: uniqueId(),
    enabled: false,  // global new sessions
    name: 'New Script',
    sessionId: sessionId,
    scriptChainProcess: 'console.log(request);\n// request.messages = ...',
  }
  await (await db).put('scripts', newScript)
  scriptsEnabled = [...scriptsEnabled, newScript.id]
  notifyDbScripts()
  let { clientX: left, clientY: top } = event
  top += 16
  left -= 512
  windowsStore.add({component: ScriptEditorWindow, data: { id: newScript.id }, left, top})
}

const apisWithToken = $derived.by(() => {
  configUpdated.i
  return Object.values(CONFIG.apis).filter(api => api?.token).length
})
const modelsAvailable = $derived.by(() => {
  configUpdated.i
  return apisWithToken === 0 ? CONFIG.models : CONFIG.models.filter(m => CONFIG.apis[m.api]?.token)
})

let modelQuery = $state("")
const visibleModels = $derived.by(() => {
  let re = new RegExp(modelQuery, "i")
  return modelsAvailable.filter(i => re.test(i.name))
})
function onModelQueryKeydown(e) {
  if (e.key === 'Enter' && visibleModels.length) {
    model = visibleModels[0]
  }
}
</script>

<div class="params-panel">
  <div class="param">
    <label for="temperature">Temperature</label>
    <div>
      <input type="range" id="temperature" min="0" max="2" step="0.01" bind:value={temperature} />
      <input type="number" bind:value={temperature} min="0" max="2" step="0.01" />
    </div>
  </div>
  <div class="param">
    <label for="top_p">Top P</label>
    <div>
      <input type="range" id="top_p" min="0" max="1" step="0.01" bind:value={top_p} />
      <input type="number" bind:value={top_p} min="0" max="1" step="0.01" />
    </div>
  </div>
  <div class="param">
    <label for="frequency_penalty">Frequency Penalty</label>
    <div>
      <input type="range" id="frequency_penalty" min="0" max="2" step="0.01" bind:value={frequency_penalty} />
      <input type="number" bind:value={frequency_penalty} min="0" max="2" step="0.01" />
    </div>
  </div>
  <div class="param">
    <label for="presence_penalty">Presence Penalty</label>
    <div>
      <input type="range" id="presence_penalty" min="0" max="2" step="0.01" bind:value={presence_penalty} />
      <input type="number" bind:value={presence_penalty} min="0" max="2" step="0.01" />
    </div>
  </div>
  <div class="param">
    <label for="max_tokens">Max Tokens</label>
    <div>
      <input type="range" id="max_tokens" min="0" max={modelMaxToken} step="1" bind:value={max_tokens} />
      <input type="number" bind:value={max_tokens} min="0" max={modelMaxToken} step="1" />
    </div>
  </div>
  <div><hr/></div>
  <div>
    <div class="flex">
      <div>Scripts:</div>
      <div class="ml-auto"></div>
      <button onclick={createScript}>create</button>
    </div>
    {#each scripts as i}
      <div class="flex script-row">
        <input
          id={`script_enabled_${i.id}`}
          type="checkbox"
          title="toggle in session"
          checked={scriptsEnabled.includes(i.id)}
          onchange={() => { toggleScript(i.id) }}
        />
        <label for={`script_enabled_${i.id}`} class="script-name">{i.name}</label>
        <div class="ml-auto"></div>
        {#if i.sessionId}<span>⛓&#xFE0E;</span>{/if}
        <button onclick={(event) => {
          event.preventDefault()
          let { clientX: left, clientY: top } = event
          top += 16
          left -= 512
          windowsStore.add({component: ScriptEditorWindow, data: { id: i.id }, left, top})
        }}>edit</button>
      </div>
    {/each}
  </div>
  <div><hr/></div>
  <div>
    <div class="models-favorite">
      {#each $favoriteModels as m}
        <div>
          <button
            style={(m.api === model.api && m.id === model.id) ? 'font-weight: bold;' : ''}
            onclick={() => { model = MODELS.find(i => (i.api === m.api && i.id === m.id)) }}>
            {m.name}
          </button>
        </div>
      {/each}
    </div>
  </div>
  <div>
    <input
      class="w100"
      bind:value={modelQuery}
      onkeydown={onModelQueryKeydown}
      placeholder="Search model..."
    />
    <div class="current-model">
      <button
        class="star-button"
        title="Add model to favorites"
        onclick={() => {
          favoriteModels.toggle({api: model.api, id: model.id, name: model.name})
        }}>
        {$favoriteModels.some(f => f.id === model.id && f.api === model.api) ? '★' : '☆'}
      </button>
      {model.id}
    </div>
  </div>
  <div class="model-options-container">
    <div class="model-options">
      {#each visibleModels as m}
        <button class:model-selected={model.api === m.api && model.id == m.id} onclick={() => {model = m}}>
          {#if apisWithToken === 0 || apisWithToken > 1}
            <span class="model-api">{m.api}:&nbsp;</span>
          {/if}
          {m.name}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
.models-favorite {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5em;
  overflow-x: auto;
  scrollbar-width: thin;
}
.models-favorite button {
  font-size: 0.9em;
  padding-left: 0;
  text-align: left;
  white-space: nowrap;
}
.model-options-container {
  min-height: 12em;
  overflow: auto;
  scrollbar-width: thin;
  border: 1px solid var(--bg-color);
  border-radius: 3px;
  border: 1px solid var(--text-color);
}
.model-options {
  display: flex;
  flex-direction: column;
  width: max-content;
  font-size: 0.75em;
  min-width: 100%;
}
.model-options button {
  display: block;
  white-space: nowrap;
  padding: 0 0.3em;
  color: var(--text-color);
  text-align: left;
}
.model-options button:nth-child(even) {
  background-color: var(--bg-color);
}
.model-api {
  opacity: 0.6;
  font-size: 0.8em
}
.model-selected {
  background-color: var(--brand-color) !important;
  color: white;
}

.star-button {
  background: none;
  border: none;
  padding: 0;
  color: var(--brand-color);
  font-size: 1em;
}
.current-model {
  font-size: 0.8em;
  white-space: nowrap;
  overflow: auto hidden;
  scrollbar-width: none;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  width: 6ch;
}

input {
  vertical-align: middle;
  margin: 0 0 4px 0;
}

.params-panel {
  position: fixed;
  right: 0;
  width: 256px;
  padding: 10px;
  margin: 0 8px 0 0;
  overflow-y: auto;
  max-height: calc(100vh - 2.5em);
  border-radius: 5px;

  display: flex;
  flex-direction: column;

  background-color: var(--panel-bg-color);
  color: var(--text-color);
  box-shadow: 0px 1px 6px #00000047;
}
.params-panel > div {
  width: 100%;
}
.param {
  display: flex;
  flex-direction: column;
}
.param > div {
  display: flex;
  gap: 0.5em;
}
.param > div > input {
  font-size: 0.8em;
}
.param > div > input:first-child {
  width: 100%;
}
label {
  display: block;
  width: 100%;
  font-size: 0.75em;
}
.script-name {
  font-size: 0.85em;
  margin-left: 0.3em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
