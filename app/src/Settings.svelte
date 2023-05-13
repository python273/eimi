<script>
import { db } from './db.js';

let openaiToken = localStorage["cfg-openai-token"] || ""
$: {
	localStorage["cfg-openai-token"] = openaiToken
}

async function exportSessionsToFile() {
	const tx = (await db).transaction('sessions', 'readonly');
	const data = {};
	const keys = await tx.store.getAllKeys()
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		data[key] = await tx.store.get(key);
	}
	await tx.done
	const json = JSON.stringify(data);
	const blob = new Blob([json], {type: "application/json"});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'eimi-llm-ui-sessions.json';
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
}
function importSessionsFromFile(e) {
	e.preventDefault();
	const file = document.getElementById("import-sessions-file").files[0];
	if (!file) {
		alert("No file selected");
		return;
	}
	const reader = new FileReader();
	reader.onload = async function(e) {
		const data = JSON.parse(e.target.result);
		const tx = (await db).transaction('sessions', 'readwrite');
		await tx.store.clear();
		const keys = Object.keys(data);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			await tx.store.put(data[key], key)
		}
		await tx.done
		alert("Sessions imported");
	};
	reader.readAsText(file);
}
</script>

<main>
	<div>
		<label for="openai-token">OpenAI API key</label><br/>
		<input
			id="openai-token"
			type="password"
			bind:value={openaiToken}
		/>
		<p>
			<strong>Warning</strong>: the token is sent to the backend
			(not directly to OpenAI API)
		</p>
	</div>
	<hr/>
	<div>
		<button
			on:click={(e) => {
				e.preventDefault();
				exportSessionsToFile();
			}}
		>Export sessions to a file</button>
	</div>
	<hr/>
	<div>
		<label for="import-sessions-file">Import sessions from a file (overwrites)</label><br/>
		<input id="import-sessions-file" type="file" accept=".json"/>
		<button on:click={importSessionsFromFile}>Import</button>
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}
</style>
