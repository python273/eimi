<script>
export let parameters;
export let onUpdate;

const MODELS = ['gpt-3.5-turbo-0301', 'gpt-4'];
let model = parameters.model || MODELS[0];
let temperature = parameters.hasOwnProperty('temperature') ? parameters.temperature : 0.7;
let frequency_penalty = parameters.hasOwnProperty('frequency_penalty') ? parameters.frequency_penalty : 0.3;
let presence_penalty = parameters.hasOwnProperty('presence_penalty') ? parameters.presence_penalty : 0.3;

$: {
    onUpdate({model, temperature, frequency_penalty, presence_penalty});
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
    font-size: 0.8em;
}
.parameters > div, select {
    width: 100%;
}
</style>