<script>
export let parameters;
export let onUpdate;

const MODELS = [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-4',
    'gpt-3.5-turbo-instruct',

    'gpt-3.5-turbo-0301',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-16k-0613',

    'gpt-4-0314',
    'gpt-4-0613',
    'gpt-4-32k-0613',

    'gpt-3.5-turbo-instruct-0914',
];
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
}

let model = parameters.model || MODELS[0];
let temperature = parameters.hasOwnProperty('temperature') ? parameters.temperature : 0.7;
let frequency_penalty = parameters.hasOwnProperty('frequency_penalty') ? parameters.frequency_penalty : 0.1;
let presence_penalty = parameters.hasOwnProperty('presence_penalty') ? parameters.presence_penalty : 0.1;

let modelMaxTokenLen = getModelMaxTokenLen(model);
let target_token_len = parameters.hasOwnProperty('target_token_len') ? parameters.target_token_len : modelMaxTokenLen - 400;
let max_tokens = parameters.hasOwnProperty('max_tokens') ? parameters.max_tokens : 0;

$: {
    modelMaxTokenLen = getModelMaxTokenLen(model);
    if (target_token_len >= modelMaxTokenLen) {
        target_token_len = modelMaxTokenLen - 400;
        max_tokens = modelMaxTokenLen;
    }
    onUpdate({model, temperature, frequency_penalty, presence_penalty, target_token_len, max_tokens});
}
</script>

<div class="parameters">
    <div>
        <select bind:value={model}>
            {#each MODELS as m}
                <option value={m}>{m}</option>
            {/each}
        </select>
    </div>
    <div>
        <label for="temperature">Temperature</label>
        <input type="range" id="temperature" min="0" max="2" step="0.1" bind:value={temperature} />
        <span>{temperature}</span>
    </div>
    <div>
        <label for="frequency_penalty">Frequency Penalty</label>
        <input type="range" id="frequency_penalty" min="0" max="2" step="0.1" bind:value={frequency_penalty} />
        <span>{frequency_penalty}</span>
    </div>
    <div>
        <label for="presence_penalty">Presence Penalty</label>
        <input type="range" id="presence_penalty" min="0" max="2" step="0.1" bind:value={presence_penalty} />
        <span>{presence_penalty}</span>
    </div>
    <div>
        <label for="target_token_len">History Token Len</label>
        <input type="range" id="target_token_len" min="0" max={modelMaxTokenLen} step="1" bind:value={target_token_len} />
        <span>{target_token_len}</span>
    </div>
    <div>
        <label for="max_tokens">Max Tokens</label>
        <input type="range" id="max_tokens" min="0" max={modelMaxTokenLen} step="1" bind:value={max_tokens} />
        <span>{max_tokens}</span>
    </div>
</div>

<style>
.parameters {
    position: fixed;
    right: 0;
    background-color: var(--comment-bg-color);
    color: var(--text-color);
    border: 1px solid var(--text-color);
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