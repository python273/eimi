<script>
import { db } from "../db"
import { notifyDbScripts, uniqueId } from "../utils"
import ScriptEditorWindow from "./ScriptEditorWindow.svelte"
import windowsStore from "./windowsStore"
import { CONFIG, configUpdated } from '../config.svelte'
import { favoriteModels } from './favoriteModelsStore'
import VirtualList from '../VirtualList.svelte'

let {sessionId, parameters = $bindable(), scripts} = $props()

// TODO: proper ids instead of api + id
const MODELS = CONFIG.models || []

function getDefaultModel() {
  if (parameters._api && parameters.model) {
    const paramModel = MODELS.find(i => i.api === parameters._api && i.id === parameters.model)
    if (paramModel) return paramModel
  }

  if ($favoriteModels[0]) {
    const favoriteModel = MODELS.find(i => i.api === $favoriteModels[0].api && i.id === $favoriteModels[0].id)
    if (favoriteModel) return favoriteModel
  }
  return MODELS.find(i => CONFIG.apis[i.api]?.token) || MODELS[0]
}

let model = $state(getDefaultModel())
let stashedParams = $state({})

$effect(() => {
  const handler = () => {
    model = getDefaultModel()
  }
  window.addEventListener('welcome-finished', handler, { once: true })
})
let modelMaxToken = $derived(model['max_tokens'] || 32768)

const DEFAULT_PARAMS = [
  { id: 'temperature', key: 'temperature', widget: 'range', label: 'Temperature', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'top_p', key: 'top_p', widget: 'range', label: 'Top P', min: 0, max: 1, step: 0.01, initial_value: 1.0 },
  { id: 'frequency_penalty', key: 'frequency_penalty', widget: 'range', label: 'Frequency Penalty', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'presence_penalty', key: 'presence_penalty', widget: 'range', label: 'Presence Penalty', min: 0, max: 2, step: 0.01, initial_value: 0.0 },
  { id: 'max_tokens', key: 'max_tokens', widget: 'range', label: 'Max Tokens', min: 0, max: null, step: 1, initial_value: 0 }
]
const NON_MODEL_PARAMS = new Set(['_api', 'model', 'scriptsEnabled'])

let paramInputs = $state([])

function updateParamsToModel() {
  // Merge default params with model params
  const base = new Map(DEFAULT_PARAMS.map(p => [p.id, p]))
  if (model && model.params) {
    model.params.forEach(p => {
      base.set(p.id, { ...base.get(p.id), ...p })
    })
  }
  
  // Override initial values from config
  if (CONFIG.user_params_initial_values) {
    for (const [key, value] of Object.entries(CONFIG.user_params_initial_values)) {
      const param = base.get(key)
      if (param) {
        param.initial_value = value
      }
    }
  }
  
  // New inputs (some default params can be removed)
  paramInputs = Array.from(base.values()).filter(p => !p.remove)

  if (parameters.max_tokens > modelMaxToken) {
    parameters.max_tokens = modelMaxToken
  }

  parameters._api = model.api
  parameters.model = model.id

  // Set default values (stashed or initial)
  for (const p of paramInputs) {
    if (parameters[p.key] === undefined) {
      parameters[p.key] = stashedParams[p.key] ?? p.initial_value ?? p.options?.[0]?.value
    }
  }

  // Stash+delete values the model doesn't have
  const currentParamKeys = new Set(paramInputs.map(p => p.key))
  for (const key of Object.keys(parameters)) {
    if (!currentParamKeys.has(key) && !NON_MODEL_PARAMS.has(key)) {
      stashedParams[key] = stashedParams[key] || parameters[key]
      delete parameters[key]
    }
  }
}
updateParamsToModel()

function onModelSelect(m) {
  model = m
  updateParamsToModel()
}

function toggleScript(id) {
  if (parameters.scriptsEnabled?.includes(id)) {
    parameters.scriptsEnabled = parameters.scriptsEnabled.filter(i => i != id)
  } else {
    parameters.scriptsEnabled = [...(parameters.scriptsEnabled || []), id]
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
  parameters.scriptsEnabled = [...(parameters.scriptsEnabled || []), newScript.id]
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

// Drag and drop for favorite models
let draggedModel = $state(null)

function handleDragStart(m, event) {
  draggedModel = m
  event.dataTransfer.effectAllowed = 'move'
}

function handleDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function handleDrop(m, event) {
  event.preventDefault()
  if (draggedModel && draggedModel !== m) {
    const currentIndex = $favoriteModels.findIndex(f => f.id === draggedModel.id && f.api === draggedModel.api)
    const targetIndex = $favoriteModels.findIndex(f => f.id === m.id && f.api === m.api)
    if (currentIndex !== -1 && targetIndex !== -1) {
      favoriteModels.reorder(currentIndex, targetIndex)
    }
  }
  draggedModel = null
}

function onModelQueryKeydown(e) {
  if (e.key === 'Enter' && visibleModels.length) {
    onModelSelect(visibleModels[0])
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
          checked={parameters.scriptsEnabled?.includes(i.id)}
          onchange={() => { toggleScript(i.id) }}
        />
        <label for={`script_enabled_${i.id}`} class="script-name">{i.name}</label>
        <div class="ml-auto"></div>
        {#if i.sessionId}<span>⛓&#xFE0E;</span>{/if}
        <button title="edit" onclick={(event) => {
          event.preventDefault()
          let { clientX: left, clientY: top } = event
          top += 16
          left -= 512
          windowsStore.add({component: ScriptEditorWindow, data: { id: i.id }, left, top})
        }}><span class="ic--baseline-mode-edit"></span></button>
      </div>
    {/each}
  </div>
  <div><hr/></div>
  <div>
    <div class="models-favorite">
      {#each $favoriteModels as m}
        <div>
          <button
            draggable="true"
            style={(m.api === model.api && m.id === model.id) ? 'font-weight: bold;' : ''}
            onclick={() => { onModelSelect(MODELS.find(i => (i.api === m.api && i.id === m.id))) }}
            ondragstart={(e) => handleDragStart(m, e)}
            ondragover={handleDragOver}
            ondrop={(e) => handleDrop(m, e)}
          >
            {m.name}
          </button>
        </div>
      {/each}
    </div>
  </div>
  <div><hr/></div>
  {#each paramInputs as p (p.key)}
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
            bind:value={parameters[p.key]} />
          <input
            type="number"
            bind:value={parameters[p.key]}
            min={p.min}
            max={p.key === 'max_tokens' ? modelMaxToken : p.max}
            step={p.step} />
        {:else if p.widget === 'select'}
          <select
            id={`param-${p.key}`}
            value={p.options.findIndex(i => i.value === (parameters[p.key] ?? p.initial_value))}
            onchange={(e) => parameters[p.key] = p.options[+e.currentTarget.value].value}
          >
            {#each p.options as opt, optI}
              <option value={optI}>{opt.label}</option>
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
    <VirtualList
      class="model-options"
      items={visibleModels}
      overscan={4}
      getKey={(m) => `${m.api}:${m.id}`}
    >
      {#snippet row({ item, index })}
        <button class:model-selected={model.api === item.api && model.id == item.id} onclick={() => onModelSelect(item)}>
          {#if apisWithToken === 0 || apisWithToken > 1}
            <span class="model-api">{item.api}:&nbsp;</span>
          {/if}
          {item.name}
        </button>
      {/snippet}
    </VirtualList>
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
:global {
  .model-options-container {
    flex: 1;
    font-size: 0.75em;
    min-height: 300px;
    overflow-x: scroll;
    scrollbar-width: thin;
    border-radius: 3px;
    border: 1px solid var(--text-color);
    white-space: nowrap;
    display: flex;
  }
  .model-options {
    overflow-y: auto;
    scrollbar-width: thin;
    display: flex;
    flex-direction: column;
    min-width: fit-content;
  }
  .model-options button {
    display: block;
    padding: 0 0.3em;
    color: var(--text-color);
    text-align: left;
  }
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
