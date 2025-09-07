<script>
import { db } from "../db"
import { notifyDbScripts, omit, uniqueId } from "../utils"
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

const DEFAULT_PARAMS = [
  { id: 'temperature', key: 'temperature', widget: 'range', label: 'Temperature', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'top_p', key: 'top_p', widget: 'range', label: 'Top P', min: 0, max: 1, step: 0.01, initial_value: 1.0 },
  { id: 'frequency_penalty', key: 'frequency_penalty', widget: 'range', label: 'Frequency Penalty', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'presence_penalty', key: 'presence_penalty', widget: 'range', label: 'Presence Penalty', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'max_tokens', key: 'max_tokens', widget: 'range', label: 'Max Tokens', min: 0, max: null, step: 1, initial_value: 0 }
]
const paramInputs = $derived.by(() => {
  const base = new Map(DEFAULT_PARAMS.map(p => [p.id, p]))
  if (model && model.params) {
    model.params.forEach(p => {
      base.set(p.id, { ...base.get(p.id), ...p })
    })
  }
  return Array.from(base.values()).filter(p => !p.remove)
})

let paramState = $state(omit(parameters, ['_api', 'model', 'scriptsEnabled']))
$effect(() => {
  // Ensure each param has a value, falling back to its `initial_value` when undefined.
  // This runs whenever `model` or `paramInputs` change, but only sets values that are missing.
  for (const p of paramInputs) {
    if (paramState[p.key] === undefined) {
      let defaultVal = p.initial_value
      if (defaultVal === undefined && p.widget === 'select' && Array.isArray(p.options) && p.options.length) {
        defaultVal = p.options[0].value
      }
      if (defaultVal !== undefined) {
        paramState[p.key] = defaultVal
      }
    }
  }
})

let scriptsEnabled = $state(parameters.scriptsEnabled || [])

$effect(() => {
  if (paramState.max_tokens > modelMaxToken) {
    paramState.max_tokens = modelMaxToken
  }

  const updateObj = {
    _api: model.api,
    model: model.id,
    scriptsEnabled,
  }
  for (const p of paramInputs) {
    if (p.remove) {
      updateObj[p.key] = undefined
    } else {
      updateObj[p.key] = paramState[p.key]
    }
  }
  onUpdate(updateObj)
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
  <div><hr/></div>
  {#each paramInputs as p}
    <div class="param">
      <label for={`param-${p.key}`}>{p.label}</label>
      <div>
        {#if p.widget === 'range'}
          <input
            type="range"
            id={`param-${p.key}`}
            min={p.min}
            max={p.key === 'max_tokens' ? modelMaxToken : p.max}
            step={p.step}
            bind:value={paramState[p.key]} />
          <input
            type="number"
            bind:value={paramState[p.key]}
            min={p.min}
            max={p.key === 'max_tokens' ? modelMaxToken : p.max}
            step={p.step} />
        {:else if p.widget === 'select'}
          <select
            id={`param-${p.key}`}
            value={paramState[p.key] ?? p.initial_value}
            onchange={(e) => paramState[p.key] = e.currentTarget.value}
          >
            {#each p.options as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        {/if}
      </div>
    </div>
  {/each}
  <div><hr/></div>
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
