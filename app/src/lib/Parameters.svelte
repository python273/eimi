<script>
import { db } from "../db"
import { notifyDbScripts, uniqueId } from "../utils"
import ScriptEditorWindow from "./ScriptEditorWindow.svelte"
import windowsStore from "./windowsStore"
import { CONFIG } from '../config'

export let sessionId
export let parameters
export let scripts
export let onUpdate

// TODO: proper ids instead of api + id
const MODELS = CONFIG.models || []
const MODELS_FAVORITE = CONFIG.models_favorite || []
const DEFAULT_MODEL = MODELS_FAVORITE[0].id || MODELS[0].id

let model = MODELS.some(i => (i.api === parameters._api && i.id === parameters.model)) ? parameters.model : DEFAULT_MODEL || DEFAULT_MODEL
let modelMaxToken = 4096

let temperature = parameters.temperature ?? 0.0
let top_p = parameters.top_p ?? 1.0
let frequency_penalty = parameters.frequency_penalty ?? 0.0
let presence_penalty = parameters.presence_penalty ?? 0.0
let max_tokens = parameters.max_tokens ?? 0

let scriptsEnabled = parameters.scriptsEnabled || []

function toggleScript(id) {
  if (scriptsEnabled.includes(id)) {
    scriptsEnabled =  scriptsEnabled.filter(i => i != id)
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
    scriptChainProcess: 'return chain;',
  }
  await (await db).put('scripts', newScript)
  scriptsEnabled = [...scriptsEnabled, newScript.id]
  notifyDbScripts()
  let { clientX: left, clientY: top } = event
  top += 16
  left -= 512
  windowsStore.add({component: ScriptEditorWindow, data: { id: newScript.id }, left, top})
}

$: {
  if (model.indexOf('claude-') === 0 && max_tokens === 0) { max_tokens = modelMaxToken }
  let modelInfo = MODELS.filter(m => m.id == model)[0]
  modelMaxToken = modelInfo['max_tokens'] || 32768
  if (max_tokens > modelMaxToken) {
    max_tokens = modelMaxToken
  }
  onUpdate({
    _api: modelInfo.api,
    model,
    completion: modelInfo.completion,  // TODO: move out of params, get from model info
    temperature, frequency_penalty, presence_penalty,
    max_tokens,
    scriptsEnabled,
  })
}

let modelQuery = ""
let visibleModels = MODELS
$: {
  let re = new RegExp(modelQuery, "i")
  visibleModels = MODELS.filter(i => re.test(i.name))
}
function onModelQueryKeydown(e) {
  if (e.key === 'Enter' && visibleModels.length) {
    model = visibleModels[0].id
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
      <button on:click={createScript}>create</button>
    </div>
    {#each scripts as i}
      <div class="flex script-row">
        <input
          type="checkbox"
          title="toggle in session"
          checked={scriptsEnabled.includes(i.id)}
          on:change={() => { toggleScript(i.id) }}
        />
        <div class="script-name">{i.name}</div>
        <div class="ml-auto"></div>
        <button on:click={(event) => {
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
  <div class="models-favorite">
    {#each MODELS_FAVORITE as m}
      <div>
        <button
          style={m.id === model ? 'font-weight: bold;' : ''}
          on:click={() => { model = m.id }}>
          {m.name}
        </button>
      </div>
    {/each}
  </div>
  <div>
    <input
      class="w100"
      bind:value={modelQuery}
      on:keydown={onModelQueryKeydown}
      placeholder="Search model..."
    />
    <div class="current-model">{model}</div>
  </div>
  <div class="model-options-container">
    <div class="model-options">
      {#each visibleModels as m}
        <label class:model-selected={model == m.id}>
          <input type="radio" bind:group={model} value={m.id}>
          <span class="custom-radio">{m.name}</span>
        </label>
      {/each}
    </div>
  </div>
</div>

<style>
.models-favorite {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5em;
}
.models-favorite button {
  font-size: 0.9em;
  padding-left: 0;
}
.model-options-container {
  min-height: 12em;
  overflow: auto;
  border: 1px solid var(--bg-color);
  border-radius: 3px;
  border: 1px solid var(--text-color);
}
.model-options {
  display: flex;
  flex-direction: column;
  width: max-content;
}
.model-options input[type=radio] {
  display: none;
}
.model-options label {
  display: block;
  white-space: nowrap;
  padding: 0 0.3em;
}
.model-options label:nth-child(even) {
  background-color: var(--bg-color);
}
.model-selected {
  background-color: var(--brand-color) !important;
  color: white;
}
.current-model {
  font-size: 0.8em;
  white-space: nowrap;
  overflow: auto hidden;
  scrollbar-width: none;
  font-weight: bold;
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
.script-row {
  align-items: baseline;
}
.script-name {
  margin-left: 0.3em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>