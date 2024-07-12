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

<div style="height: max(100vh, 2000px);"></div>
</main>

<style>
.sessions {
	position: absolute;
	left: 0;
	margin: 0 10px;
}
.sessions a {
	color: var(--color-text);
	display: block;
	max-width: 20ch;
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
