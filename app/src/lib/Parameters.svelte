<script>
import { db } from "../db";
import { notifyDbScripts, uniqueId } from "../utils";
import ScriptEditorWindow from "./ScriptEditorWindow.svelte";
import windowsStore from "./windowsStore";

export let sessionId;
export let parameters;
export let scripts;
export let onUpdate;

const CONFIG = JSON.parse(localStorage['cfg-config']);
const MODELS = CONFIG.models || [];
const DEFAULT_MODEL = MODELS.filter(i => i.defaultModel)[0].id || 'gpt-4o-2024-05-13';

let model = MODELS.some(i => i.id == parameters.model) ? parameters.model : DEFAULT_MODEL || DEFAULT_MODEL;
let modelMaxToken = 4096;

let temperature = parameters.hasOwnProperty('temperature') ? parameters.temperature : 0.0;
let frequency_penalty = parameters.hasOwnProperty('frequency_penalty') ? parameters.frequency_penalty : 0.0;
let presence_penalty = parameters.hasOwnProperty('presence_penalty') ? parameters.presence_penalty : 0.0;
let target_token_len = parameters.hasOwnProperty('target_token_len') ? parameters.target_token_len : 0;
let max_tokens = parameters.hasOwnProperty('max_tokens') ? parameters.max_tokens : 0;

let scriptsEnabled = parameters.scriptsEnabled || [];

function toggleScript(id) {
	if (scriptsEnabled.includes(id)) {
		scriptsEnabled =  scriptsEnabled.filter(i => i != id);
	} else {
		scriptsEnabled = [...scriptsEnabled, id]
	}
}

async function createScript() {
	const newScript = {
		id: uniqueId(),
		enabled: false,  // global
		name: 'New Script',
		sessionId: sessionId,
		scriptChainProcess: 'return chain;',
	};
	await (await db).put('scripts', newScript);
	scriptsEnabled = [...scriptsEnabled, newScript.id]
	notifyDbScripts();
	windowsStore.add(ScriptEditorWindow, { id: newScript.id });
}

$: {
	if (model.indexOf('claude-') === 0 && max_tokens === 0) { max_tokens = modelMaxToken; }
	let modelInfo = MODELS.filter(m => m.id == model)[0];
	modelMaxToken = modelInfo['max_tokens'] || 32768;
	if (max_tokens > modelMaxToken) {
		max_tokens = modelMaxToken;
	}
	onUpdate({
		_api: modelInfo.api,
		model,
		completion: modelInfo.completion,  // TODO: move out of params, get from model info
		temperature, frequency_penalty, presence_penalty,
		target_token_len, max_tokens,
		scriptsEnabled,
	})
}

let modelQuery = "";
let visibleModels = MODELS;
$: {
	let re = new RegExp(modelQuery, "i");
	visibleModels = MODELS.filter(i => re.test(i.name));
}
</script>

<div class="parameters">
	<div>
		<label for="temperature">Temperature</label>
		<input type="range" id="temperature" min="0" max="2" step="0.1" bind:value={temperature} />
		<input type="number" bind:value={temperature} min="0" max="2" step="0.1" />
	</div>
	<div>
		<label for="frequency_penalty">Frequency Penalty</label>
		<input type="range" id="frequency_penalty" min="0" max="2" step="0.1" bind:value={frequency_penalty} />
		<input type="number" bind:value={frequency_penalty} min="0" max="2" step="0.1" />
	</div>
	<div>
		<label for="presence_penalty">Presence Penalty</label>
		<input type="range" id="presence_penalty" min="0" max="2" step="0.1" bind:value={presence_penalty} />
		<input type="number" bind:value={presence_penalty} min="0" max="2" step="0.1" />
	</div>
	<div>
		<label for="target_token_len">Crop Context Tokens (gpt-4o)</label>
		<input type="range" id="target_token_len" min="0" max={32768} step="1" bind:value={target_token_len} />
		<input type="number" bind:value={target_token_len} min="0" max={32768} step="1" />
	</div>
	<div>
		<label for="max_tokens">Max Tokens</label>
		<input type="range" id="max_tokens" min="0" max={modelMaxToken} step="1" bind:value={max_tokens} />
		<input type="number" bind:value={max_tokens} min="0" max={modelMaxToken} step="1" />
	</div>
	<div>
		<div class="flex">
			<div>Scripts:</div>
			<div class="ml-auto"></div>
			<button on:click={createScript}>create</button>
		</div>
		{#each scripts as i}
			<div class="flex">
				<input
					type="checkbox"
					title="toggle in session"
					checked={scriptsEnabled.includes(i.id)}
					on:change={() => { toggleScript(i.id) }}
				/>
				<div class="script-name">{i.name}</div>
				<div class="ml-auto"></div>
				{#if !i.sessionId}
					<input
						type="checkbox"
						title="toggle global"
						checked={i.enabled}
						on:change={async () => {
							i.enabled = !i.enabled;
							await (await db).put('scripts', i);
							notifyDbScripts();
						}}
					/>
				{/if}
				<button on:click={() => {
					windowsStore.add(ScriptEditorWindow, { id: i.id });
				}}>edit</button>
			</div>
		{/each}
	</div>
	<div>
		<hr/>
		<input bind:value={modelQuery} placeholder="Search model..." />
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
.model-options-container {
	min-height: 12em;
	overflow: auto;
	border: 1px solid var(--bg-color);
	border-radius: 3px;
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
}
.model-options label:nth-child(even) {
	background-color: var(--bg-color);
}
.model-selected {
	background-color: var(--brand-color) !important;
	color: white;
}
.current-model {
	font-size: 0.8;
	white-space: nowrap;
	overflow: auto hidden;
	scrollbar-width: none;
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
	margin: 2px 0 6px 0;
}

.parameters {
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
}
label {
	display: block;
	width: 100%;
	font-size: 0.8em;
}
.parameters > div {
	width: 100%;
}
.script-name {
	margin-left: 0.3em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>