<script>
import Session from './Session.svelte';

if (!("dark-theme" in localStorage)) {
	const val = (
		window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
	) ? 1 : 0;
	localStorage["dark-theme"] = val;
}

let darkTheme = localStorage["dark-theme"] === "1";
$: {
	localStorage["dark-theme"] = darkTheme ? 1 : 0;
}

window.addEventListener('storage', (event) => {
	if (event.key !== "dark-theme") return;
	darkTheme = localStorage["dark-theme"] === "1"
});

let page = 'session';
let props = {};
</script>

{#if !darkTheme}
<style>
	:root {
		--bg-color: #ecedee;
		--text-color: #000;
		--comment-bg-color: #fff;
		--meta-color: rgb(94, 126, 142);
	}

	html {
		scrollbar-color: #000 transparent;
	}
</style>
{:else}
<style>
	:root {
		--bg-color: #181412;
		--text-color: rgb(233, 225, 204);
		--comment-bg-color: rgb(55, 45, 40);
		--meta-color: rgb(179, 172, 152);
	}

	html {
		scrollbar-color: #fff transparent;
	}
</style>
{/if}

<div class="header">
	<div class="home"><a href="#" class="no-vs">LLM UI</a></div>

	<div class='ml-auto'></div>
	<div class="settings">
		<input
		  class="c-pointer"
			id="dark-theme-checkbox"
			type="checkbox" bind:checked={darkTheme}
			title="dark theme"
		/>
		<label for="dark-theme-checkbox" class="c-pointer">{" "}☾</label>
	</div>
</div>

<div class="page">
{#if page === "session"}
	<Session {...props}/>
{/if}
</div>

<style>
:global(html, body) {
	background-color: var(--bg-color);
	color: var(--text-color);
}

.home {
	font-size: 1.4em;
	font-family: monospace;
}

.header {
	width: 100%;
	height: 32px;
	padding: 0 16px;
	display: flex;
	align-items: center;
}

.page {
	width: 100%;
	overflow-x: hidden;
}
@media only screen and (min-width: 900px) {
	.settings {
		position: fixed;
		right: 16px;
	}
}
</style>
