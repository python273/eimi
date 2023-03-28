<script>
import { tick } from 'svelte';
import CustomInput from './lib/CustomInput.svelte';

function uniqueId() { return Date.now().toString(36) }

const SESSION_ID = window.location.hash.slice(1)
window.addEventListener('hashchange', () => { window.location.reload() })
if (!SESSION_ID) { window.location.hash = `#${uniqueId()}` }

const U = 'user'
const A = 'assistant'

function saveSession(sessionId) {
	const savedData = data.map(
		({id, parentId, role, content}) => ({id, parentId, role, content})
	)
	localStorage.setItem(sessionId, JSON.stringify(savedData))
}
function loadSession(sessionId) {
	const data = localStorage.getItem(sessionId)
	if (data === null) { return [{id: 'genesis', parentId: null, role: U, content: ''}] }
	return JSON.parse(data)
}

let data = loadSession(SESSION_ID)

function _timerSave() {
	saveSession(SESSION_ID)
	console.log('saved')
}
let saveTimeoutId = null
function scheduleSave(t=1000) {
	if (saveTimeoutId !== null) { clearTimeout(saveTimeoutId) }
	saveTimeoutId = setTimeout(_timerSave, t)
}

$: {
	window._messages = data
	data = relationalToLinear(data)
	scheduleSave()
}

function relationalToLinear(data) {
	// accepts list of objects with id, parentId
	// returns a linear list, each items has `depth`
	// if there's a sub-thread, where each item has a single reply
	// it should be displayed linearly (without adding depth)
	// so besides `depth`, there should be `ddepth` (display depth)

	const replies = {}	// {parentId: [item, ...]}
	for (const item of data) {
		if (item.parentId === null) { continue }
		if (replies[item.parentId] === undefined) {
			replies[item.parentId] = []
		}
		replies[item.parentId].push(item)
	}

	const out = []

	function _pushItemWithReplies(item) {
		out.push(item)
		if (replies[item.id] === undefined) {
			item.lastInChain = true
			return
		}
		item.lastInChain = undefined

		const children = replies[item.id]
		if (children.length === 1) {
			item.linear = true
			const a = children[0]
			a.depth = item.depth + 1
			a.ddepth = item.ddepth  // no padding
			a.linear = true
			_pushItemWithReplies(a)
		} else {
			item.linear = undefined
			for (const a of children) {
				a.depth = item.depth + 1
				a.ddepth = item.ddepth + 1
				_pushItemWithReplies(a)
			}
		}
	}

	for (const item of data) {  // finding genesis
		if (item.parentId !== null) { continue }
		item.depth = 0
		item.ddepth = 0
		_pushItemWithReplies(item)
	}

	return out
}

async function onReply(event) {
	event.preventDefault()
	const index = parseInt(event.target.closest('.message').dataset.index, 10)
	const item = data[index]

	const newItem = {
		id: uniqueId(),
		parentId: item.id,
		role: U,
		content: ''
	}
	data.unshift(newItem)
	data = data
	await tick()
	const newEl = document.getElementById(`m_${newItem.id}`)
	newEl.querySelector('textarea').focus()
}

async function onRoleChange(event) {
	const index = parseInt(event.target.closest('.message').dataset.index, 10)
	data[index].role = event.target.value
	scheduleSave(0)
}

async function deleteMessage(event) {
	event.preventDefault()
	if (!confirm('Are you sure?')) { return }
	const index = parseInt(event.target.closest('.message').dataset.index, 10)
	const item = data[index]

	const idsToDelete = [item.id]
	function _addChildren(item) {
		const children = data.filter(i => i.parentId === item.id)
		for (const child of children) {
			idsToDelete.push(child.id)
			_addChildren(child)
		}
	}
	_addChildren(item)

	data = data.filter(i => !idsToDelete.includes(i.id))
	scheduleSave(0)
}

async function genResponse(event, regenerate=false) {
	event.preventDefault()
	const index = parseInt(event.target.closest('.message').dataset.index, 10)
	const item = data[index]

	const chain = []
	let it = item
	if (!regenerate) { chain.unshift(item) }
	while (1) {
		const parent = data.find(i => i.id === it.parentId)
		if (parent === undefined) { break }
		chain.unshift(parent)
		it = parent
	}

	let newItem
	if (!regenerate) {
		newItem = {
			id: uniqueId(),
			parentId: item.id,
			role: A,
			content: '',
			generating: true
		}
		data.unshift(newItem)
	} else {
		item.content = ''
		item.generating = true
		newItem = item
	}
	data = data
	await tick()

	const response = await fetch(
		'http://127.0.0.1:8000/chain', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				chain: chain.map((item) => ({role: item.role, content: item.content}))
			})
		}
	)
	newItem.tokenLen = parseInt(response.headers.get('x-token-len'), 10)
	newItem.cropped = parseInt(response.headers.get('x-cropped'), 10)

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let text = ''
	while (true) {
		const { done, value } = await reader.read()
		if (done) { break }
			const decoded = decoder.decode(value, {stream: true})
			text += decoded
			newItem.content = text
			data = data
			await tick()
	}
	newItem.generating = false
	data = data
}

async function onUpdate() {
	scheduleSave()
}
</script>

<main>
<div class="messages">
{#each data as c, i (c.id)}
	<div id={`m_${c.id}`} class="message" data-id="{c.id}" data-index="{i}" class:linear="{c.linear}">
		<div class="flex">
			{#each {length: c.ddepth} as _, dpth}
				<div class='pad' class:pad-colored="{!c.linear}"></div>
			{/each}

			<div>
				<div class="message__content" class:generating="{c.generating}">
					<div class="message__header">
						<select class="role" value={c.role} on:change="{onRoleChange}">
							<option value={A}>{A}</option>
							<option value={U}>{U}</option>
						</select>
						{#if c.tokenLen !== undefined && c.tokenLen > 0}
							<div class="meta-gray" title="Token length">({c.tokenLen})</div>
						{/if}
						{#if c.cropped !== undefined && c.cropped > 0}
							<div class="meta-gray" title="Cropped messages">(M-{c.cropped})</div>
						{/if}
						<div class="ml-auto"></div>
						<button class="deleteButton" on:click="{deleteMessage}">x</button>
						<button class="gen" on:click="{(e) => genResponse(e, true)}">regen</button>
						<button class="gen" on:click="{(e) => genResponse(e, false)}">gen</button>
						<button class="reply" on:click="{onReply}">&#10149;&#xFE0E;</button>
					</div>
					<CustomInput value={c.content} obj={c} onUpdate="{onUpdate}" />
				</div>
				{#if c.linear && !c.lastInChain}<div class="linear-pad"></div>{/if}
			</div>
		</div>
	</div>
{/each}
</div>
<div style="height: max(100vh, 2000px);"></div>
</main>

<style>
main {
	width: 100%;
	display: flex;
	align-items: center;
	flex-direction: column;
}

.role {
	background: none;
	border: none;
	color: var(--brand-color);
}

.pad {
	margin-right: 8px;
	width: 5px;
	max-width: 5px;
	min-width: 5px;
	content: '';
	background-color: var(--text-color);
}

.pad-colored {
	background-color: var(--text-color);
}

.linear-pad {
	width: 5px;
	height: 4px;
	margin-left: 16px;
	content: '';
	background-color: var(--text-color);
}

.message__content {
	width: 62ch;
	margin: 1px 0;
	padding: 0 10px 5px 10px;
	border-radius: 5px;
	background-color: var(--comment-bg-color);
	border: 1px solid var(--comment-bg-color);
}

.generating {
	border: 1px solid var(--brand-color);
}

.message__header * {
	text-decoration: none;
	white-space: nowrap;
}

.message__header {
	margin: 0 5px 0 0;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 14px;
	font-size: 0.9em;
}
</style>
