<script>
import SessionPage from './SessionPage.svelte';
import Settings from './Settings.svelte';
import WindowManager from './lib/WindowManager.svelte';
import windowsStore from './lib/windowsStore';
import { genSessionId } from './utils.js';
import { themeStore } from './themeStore.js';
import Welcome from './Welcome.svelte';

let hash = window.location.hash.slice(1)

window.addEventListener('popstate', () => {
    window.scrollTo(0, 0);
    hash = window.location.hash.slice(1);
});

let page;
let props = {};

$: {
	let params = Object.fromEntries(new URLSearchParams(hash.split('?')[1]))
	if (hash === 'settings') {
		page = 'settings'
	} else {
		page = 'session'
		if (!hash) {
			hash = genSessionId();
			history.replaceState(null, '', '#' + hash);
		} else if (hash.indexOf('?answer=') === 0) {
			hash = `${genSessionId()}${hash}`;
			params = Object.fromEntries(new URLSearchParams(hash.split('?')[1]))
			history.replaceState(null, '', '#' + hash);
		}
		props = {sessionId: hash.split('?')[0], autoReply: params.answer}
	}
	console.log('page', hash, page, props, params);
}
</script>

{#if !($themeStore)}
<style>
	:root {
		--bg-color: #ecedee;
		--text-color: #000;
		--comment-bg-color: #fff;
		--panel-bg-color: #f7f7f7;
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
		--panel-bg-color: #241e1b;
		--meta-color: rgb(179, 172, 152);
	}

	html {
		scrollbar-color: #fff transparent;
	}
</style>
{/if}

<div class="header">
	<!-- svelte-ignore a11y-invalid-attribute -->
	<div class="home"><a href="#" class="no-vs">Eimi</a></div>
	<div class='ml-auto'></div>
	<div class="settings">
		<a
			class="settings-link no-vs"
			href="#settings"
			title="settings"
		>settings</a>
		<input
			class="c-pointer"
			id="dark-theme-checkbox"
			type="checkbox" bind:checked={$themeStore}
			title="dark theme"
		/>
		<label for="dark-theme-checkbox" class="c-pointer">{" "}☾</label>
	</div>
</div>

<div class="page">
{#if page === "session" && props.sessionId}
	<SessionPage {...props}/>
{/if}
{#if page === "settings"}
	<Settings/>
{/if}
</div>

<Welcome/>
<WindowManager store={windowsStore}/>

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
	position: fixed;
	top: 0;
	width: 100%;
	height: 32px;
	padding: 0 16px;
	display: flex;
	align-items: center;
	pointer-events: none;
}
.header > * {
	pointer-events: initial;
}

.page {
	margin-top: 32px;
	width: 100%;
	overflow-x: hidden;
}
.settings {
	right: 16px;
}
.settings-link {
	margin-right: 1em;
}
</style>
