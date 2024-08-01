<script>
import { db } from './db.js';
import Session from './Session.svelte';

export let sessionId
export let autoReply
if (!sessionId) { throw new Error('sessionId is required') }

let sessions = []
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
<div class="sessions">
	{#each sessions as s (s.key)}
		<a href={`#${s.key}`}>{s.title}</a>
	{/each}
</div>

{#key sessionId}
	<Session sessionId={sessionId} autoReply={autoReply} />
{/key}

<div style="height: max(60vh);"></div>
</main>

<style>
.sessions {
	position: fixed;
	left: 0;
	padding: 5px 10px;
	height: calc(100% - 32px);
	width: 22ch;
	overflow-y: auto;
	background-color: var(--panel-bg-color);
	border-radius: 5px;
	margin: 0 0 0 8px;
	font-size: 0.94em;
}
.sessions a {
	color: var(--color-text);
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
main {
	width: 100%;
	display: flex;
	align-items: center;
	flex-direction: column;
}
</style>
