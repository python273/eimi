<script>
import { db } from './db.js';
import { escapeRegExp } from './utils.js';
import Session from './Session.svelte';

export let sessionId
export let autoReply
if (!sessionId) { throw new Error('sessionId is required') }

let sessions = []
let searchQuery = ''
let filteredSessions = []
$: {
	if (searchQuery === '') {
		filteredSessions = sessions
	} else {
		let searchRe = new RegExp(escapeRegExp(searchQuery), 'i')
		filteredSessions = sessions.filter(s => searchRe.test(s.title))
	}
}
async function loadSessionsList() {
	const tx = (await db).transaction('sessions', 'readonly');
	const keys = await tx.store.getAllKeys()
	keys.sort((a, b) => b.localeCompare(a))
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]
		let obj = await tx.store.get(key)
		const title = obj.title
		sessions.push({key, title})
	}
	sessions = sessions
}
loadSessionsList()
</script>

<main>
<div class="sessions-panel">
	<input
		type="search"
		placeholder="Search..."
		bind:value={searchQuery}
	/>
	<div class="sessions-list">
		{#each filteredSessions as s (s.key)}
			<a href={`#${s.key}`} class:session-active={s.key === sessionId}>{s.title}</a>
		{:else}
			<span style="filter: opacity(30%); margin: 10px;">Sessions will be here.</span>
		{/each}
	</div>
</div>

{#key sessionId}
	<Session {sessionId} {autoReply} />
{/key}

<div style="height: max(60vh);"></div>
</main>

<style>
.sessions-panel {
	position: fixed;
	left: 0;
	padding: 5px 0;
	height: calc(100% - 32px);
	width: 22ch;
	overflow-y: auto;
	background-color: var(--panel-bg-color);
	border-radius: 5px;
	margin: 0 0 0 8px;
	font-size: 0.94em;
	box-shadow: 0px 1px 6px #00000047;
	display: flex;
	flex-direction: column;
}
.sessions-list {
	max-width: 100%;
	overflow-y: auto;
}
.sessions-list a {
	padding: 0 5px;
	margin: 0 5px;
	color: var(--color-text);
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	border-radius: 2px;
}
.sessions-list a:hover {
	background: #0000000f;
}
.sessions-list .session-active {
	color: #fff;
	background: var(--brand-color) !important;
}
main {
	width: 100%;
	display: flex;
	align-items: center;
	flex-direction: column;
}
</style>
