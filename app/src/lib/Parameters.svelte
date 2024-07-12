<script>
export let parameters;
export let onUpdate;

const CONFIG = JSON.parse(localStorage['cfg-config']);
const MODELS = CONFIG.models || [];
const DEFAULT_MODEL = MODELS.filter(i => i.defaultModel)[0].id || 'gpt-4-0125-preview';

function getModelMaxTokenLen(model) {
    if (model.indexOf('gpt-4-32k') === 0) {
        return 32768
    } else if (model.indexOf('gpt-4') === 0) {
        return 8192
    } else if (model.indexOf('gpt-3.5-turbo-16k') === 0) {
        return 16384
    } else if (model.indexOf('gpt-3.5-turbo-instruct') === 0) {
        return 4096
    } else if (model.indexOf('gpt-3.5-turbo') === 0) {
        return 4096
    }
    return 32768;
}

let model = parameters.model || DEFAULT_MODEL;
let temperature = parameters.hasOwnProperty('temperature') ? parameters.temperature : 0.0;
let frequency_penalty = parameters.hasOwnProperty('frequency_penalty') ? parameters.frequency_penalty : 0.0;
let presence_penalty = parameters.hasOwnProperty('presence_penalty') ? parameters.presence_penalty : 0.0;

let modelMaxTokenLen = getModelMaxTokenLen(model);
let target_token_len = parameters.hasOwnProperty('target_token_len') ? parameters.target_token_len : modelMaxTokenLen - 400;
let max_tokens = parameters.hasOwnProperty('max_tokens') ? parameters.max_tokens : 0;

$: {
    modelMaxTokenLen = getModelMaxTokenLen(model);
    if (target_token_len >= modelMaxTokenLen) {
        target_token_len = modelMaxTokenLen - 400;
        max_tokens = modelMaxTokenLen;
    }
    const modelInfo = MODELS.filter(m => m.id == model)[0];
    onUpdate({
        _api: modelInfo.api,
        model, temperature, frequency_penalty, presence_penalty, target_token_len, max_tokens
    })
}
</script>

<div class="parameters">
    <div>
        <select bind:value={model}>
            {#each MODELS as m}
                <option value={m.id}>{m.name}</option>
            {/each}
        </select>
    </div>
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
        <label for="target_token_len">Crop Context Tokens</label>
        <input type="range" id="target_token_len" min="0" max={modelMaxTokenLen} step="1" bind:value={target_token_len} />
        <input type="number" bind:value={target_token_len} min="0" max={modelMaxTokenLen} step="1" />
    </div>
    <div>
        <label for="max_tokens">Max Tokens</label>
        <input type="range" id="max_tokens" min="0" max={modelMaxTokenLen} step="1" bind:value={max_tokens} />
        <input type="number" bind:value={max_tokens} min="0" max={modelMaxTokenLen} step="1" />
    </div>
</div>

<style>
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
    background-color: var(--comment-bg-color);
    color: var(--text-color);
    width: 256px;
	border-radius: 5px;
    padding: 10px;
    margin: 10px;

    display: flex;
    flex-direction: column;
}
label {
    display: block;
    width: 100%;
    font-size: 0.8em;
}
.parameters > div, select {
    width: 100%;
}
</style>