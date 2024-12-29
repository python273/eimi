<script>
import { db } from './db.js';
import DEFAULT_CONFIG from "./default_config.json";
import { refreshConfig } from './config.js';

let config = localStorage["cfg-config-user"] || ""
let valid = false;
$: {
	try {
		JSON.parse(config);
		valid = true
	} catch {
		valid = false;
	}
	if (valid) {
		localStorage["cfg-config-user"] = config
		refreshConfig();
	}
}

let importFileInput;

async function exportSessionsToFile() {
	const tx = (await db).transaction('sessions', 'readonly');
	const data = {sessions: {}};
	const keys = await tx.store.getAllKeys()
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		data.sessions[key] = await tx.store.get(key);
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
	const file = importFileInput.files[0];
	if (!file) {
		alert("No file selected");
		return;
	}
	const reader = new FileReader();
	reader.onload = async function(e) {
		let data = JSON.parse(e.target.result);
		data = 'sessions' in data ? data.sessions : data;
		const tx = (await db).transaction('sessions', 'readwrite');
		await tx.store.clear();
		const keys = Object.keys(data);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			await tx.store.put(data[key], key)
		}
		await tx.done
		importFileInput.value = '';
		alert("Sessions imported");
	};
	reader.readAsText(file);
}
</script>

<main>
	<div>
		<label for="config">Config Base</label><br/>
		<details>
			<textarea id="config" value={JSON.stringify(DEFAULT_CONFIG, undefined, 2)} style="width: 60ch; height: 300px;" disabled/>
		</details>
	</div>
	<div>
		<label for="config">Config User</label><br/>
		<textarea
			id="config"
			bind:value={config}
			style="width: 60ch; height: 300px;"
			class:invalid={!valid}
		/>
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
		<label for="import-sessions-file">Import sessions from a file (deletes existing data)</label><br/>
		<input bind:this={importFileInput} id="import-sessions-file" type="file" accept=".json"/>
		<button on:click={importSessionsFromFile}>Import</button>
	</div>
	<hr/>
	<div>
		<a href="https://github.com/python273/eimi">https://github.com/python273/eimi</a>
	</div>
</main>

<style>
main {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
#config {
	font-family: monospace;
}
hr {
	width: 100%;
}
.invalid {
	outline: 4px solid red;
}
</style>
