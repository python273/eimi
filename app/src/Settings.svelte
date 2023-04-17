<script>
	let openaiToken = localStorage["cfg-openai-token"] || "";
	$: {
		localStorage["cfg-openai-token"] = openaiToken;
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
</main>

<style>
	main {
		display: flex;
		justify-content: center;
	}
</style>
