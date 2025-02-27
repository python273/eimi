<script>
import { onMount } from 'svelte';
import { db } from '../db.js';
import windowsStore from './windowsStore.js';
import { notifyDbScripts } from '../utils.js';

export let windowId;
export let id;

let script;
let isLoading = true;

function getWindowTitle() {
	if (!script) return '';
	let g = script.sessionId ? ` (session ${script.sessionId})` : ' (global)';
	return `Script "${script.name}"${g}`;
}

async function loadScript() {
	isLoading = true;
	const loadedScript = await (await db).get('scripts', id);
	if (loadedScript) {
		script = loadedScript;
	} else {
		console.error('Script not found');
	}
	isLoading = false;
}

onMount(async () => {
	await loadScript();
});

function convertToGlobal() {
	script.sessionId = '';
	scheduleSave(0);
}

function toggleGlobalEnabled() {
	script.enabled = !script.enabled;
	scheduleSave(0);
}

async function _saveScript() {
	console.log('saving script', script.id);
	const dbInstance = await db;
	const tx = dbInstance.transaction('scripts', 'readwrite');
	const store = tx.objectStore('scripts');
	const loadedScript = await store.get(id);
	loadedScript.name = script.name;
	loadedScript.scriptChainProcess = script.scriptChainProcess;
	loadedScript.sessionId = script.sessionId;
	loadedScript.enabled = script.enabled;
	await store.put(loadedScript);
	await tx.done;
	notifyDbScripts();
}
let saveTimeoutId = null
function scheduleSave(t=250) {
	if (saveTimeoutId !== null) { clearTimeout(saveTimeoutId) }
	saveTimeoutId = setTimeout(_saveScript, t)
}
$: {
	script;
	windowsStore.updateById(windowId, {title: getWindowTitle()});
	scheduleSave();
}

async function deleteScript(event) {
	event.preventDefault()
	if (!event.shiftKey && !confirm('Delete script?')) { return; }
	await (await db).delete('scripts', id);
	notifyDbScripts();
	windowsStore.close(windowId);
}
</script>

{#if !isLoading}
<div class="script-editor">
	<div class="flex">
		<input
			class="w100"
			type="text"
			bind:value={script.name}
			placeholder="Script Name"
		/>
		{#if script.sessionId}
			<button on:click="{convertToGlobal}" title="convert to global">make global</button>
		{/if}
		<button on:click="{deleteScript}" title="delete script (hold shift)">delete</button>
	</div>
	{#if !script.sessionId}
		<div>
			<input
				id={`${windowId}-${script.id}-enabled`}
				type="checkbox"
				checked={script.enabled}
				style="margin-left: 5px;"
				on:change={toggleGlobalEnabled}
			/>
			<label for={`${windowId}-${script.id}-enabled`}>auto-enable for new sessions</label>
		</div>
	{/if}
	<textarea
		bind:value={script.scriptChainProcess}
		placeholder="Script content"
		rows="10"
		spellcheck="false"
		autocorrect="off"
		autocapitalize="off"
		autocomplete="off"
	></textarea>
</div>
{/if}

<style>
.script-editor {
	width: 100%;
	height: 100%;
	overflow: auto;

	display: flex;
	flex-direction: column;
}
button {
	white-space: nowrap;
}
input, textarea {
	resize: none;
}
textarea {
	height: 100%;
	font-family: monospace;
}
</style>