<script>
import { refreshConfig } from "./config";

let show = false;
let config;

let step = 1;
let tokens = {};
let proxies = {};

try {
	config = JSON.parse(localStorage["cfg-config-user"]);
	show = localStorage.getItem("cfg-welcome") === null && 
		Object.keys(config.apis).every(api => 
			config.apis[api].$set.token === "");
	Object.keys(config.apis).forEach((api) => {
		tokens[api] = "";
		proxies[api] = false;
	});
} catch {
	show = false;
}

function skip() {
	localStorage.setItem("cfg-welcome", "1");
	show = false;
}

function saveTokens() {
	const config = JSON.parse(localStorage["cfg-config-user"]);
	Object.keys(tokens).forEach((api) => {
		config.apis[api].$set.token = tokens[api];
		config.apis[api].$set.proxy = proxies[api];
	});
	localStorage["cfg-config-user"] = JSON.stringify(config, null, 2);
	localStorage.setItem("cfg-welcome", "1");
	refreshConfig();
	show = false;
}
</script>

{#if show}
<div class="overlay">
	<div class="dialog">
		{#if step === 1}
			<article>
				<button class="skip-btn" on:click={skip} title="skip">x</button>
				<h2>Welcome</h2>
				<p><strong>Eimi</strong> is an open-source UI for LLMs.</p>
				<br/>
				<ul>
					<li>Threaded tree-style UI</li>
					<li>Full context control</li>
					<li>Sessions are stored locally in the browser</li>
					<li>Multi-API: OpenAI, Anthropic, OpenRouter, Google, etc.</li>
					<li>Scripts for context modification</li>
				</ul>
				<br/>
				<p>
					<a href="https://github.com/python273/eimi"
						>https://github.com/python273/eimi</a
					>
				</p>
				<div class="dialog-buttons">
					<button on:click={() => (step = 2)}>Setup</button>
				</div>
			</article>
		{:else}
			<h2>API Setup</h2>
			<div class="tokens">
				{#each Object.keys(config.apis) as api}
					<div class="token-input">
						<label for={api}>{api}</label>
						<input
							type="text"
							id={api}
							bind:value={tokens[api]}
							placeholder="API token"
							style="flex: 1;"
						/>
						<label>
							<input type="checkbox" bind:checked={proxies[api]}/>
							proxy
						</label>
					</div>
				{/each}
			</div>
			<div class="dialog-buttons">
				<button on:click={saveTokens}>Save</button>
			</div>
		{/if}
	</div>
</div>
{/if}

<style>
article {
	position: relative;
	padding: 0 0.5em;
}
.skip-btn {
	position: absolute;
	right: 0;
	top: 0;
}
.dialog-buttons {
	margin-top: 1em;
}
.dialog-buttons button {
	width: 100%;
	border-radius: 5px;
	padding: 0.2em;
	font-weight: bold;
	background: var(--brand-color);
	color: white;
}
h2 {
	margin-top: 0;
}
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}
.dialog {
	background: var(--comment-bg-color);
	padding: 1rem;
	border-radius: 8px;
	max-width: 500px;
	width: 90%;
}
.tokens {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-height: 256px;
	overflow-y: auto;
}
.token-input {
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
	align-items: baseline;
}
.token-input input {
	margin: 2px;
}
li {
	margin-left: 1em;
}
</style>
