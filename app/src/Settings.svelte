<script>
let openaiToken = localStorage["cfg-openai-token"] || ""
$: {
	localStorage["cfg-openai-token"] = openaiToken
}

function exportLocalstorageToFile() {
	const data = {};
	const keys = Object.keys(localStorage);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		data[key] = localStorage[key];
	}
	const json = JSON.stringify(data);
	const blob = new Blob([json], {type: "application/json"});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'llm-ui-backup.json';
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
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
	<div>
		<button
			on:click={(e) => {
				e.preventDefault();
				exportLocalstorageToFile();
			}}
		>Export localstorage to a file</button>
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
