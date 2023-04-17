<script>
import { tick, onDestroy } from 'svelte';
import CustomInput from './lib/CustomInput.svelte';
import Parameters from './lib/Parameters.svelte';
import { uniqueId } from './utils.js';

export let sessionId
if (!sessionId) { throw new Error('sessionId is required') }

const U = 'user'
const A = 'assistant'

const sessions = []
function loadSessionsList() {
	const keys = Object.keys(localStorage)
	keys.sort((a, b) => b.localeCompare(a))
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]
		if (key.indexOf('session-') !== 0) { continue }
		let obj = JSON.parse(localStorage[key])
		const message = obj.messages.find(m => m.parentId === null)
		const title = obj.title
		sessions.push({key: key.slice(8), message, title})
	}
}
loadSessionsList()

let stopSaving = false
function saveSession(sessionId) {
	if (stopSaving) return;
	const savedMessages = data.map(
		({id, parentId, role, content}) => ({id, parentId, role, content})
	)
	if (savedMessages.length === 1 && savedMessages[0].content === '') return;
	const obj = {...sessionData, messages: savedMessages}
	localStorage.setItem(`session-${sessionId}`, JSON.stringify(obj))
	console.log('saved', sessionId)
}
function deleteSession() {
	stopSaving = true
	localStorage.removeItem(`session-${sessionId}`)
	console.log('deleted', sessionId)
}
function loadSession() {
	let obj = localStorage.getItem(`session-${sessionId}`)
	if (obj === null) {
		sessionData = {
			title: (new Date()).toLocaleString(),
			parameters: {},
			messages: [{id: 'genesis', parentId: null, role: U, content: ''}]
		}
		data = sessionData.messages
		return
	}
	obj = JSON.parse(obj)
	if (!obj.parameters) { obj.parameters = {} }
	sessionData = obj
	data = obj.messages
}

let sessionData
let data
loadSession()

function _saveSession() {
	saveSession(sessionId)
}
let saveTimeoutId = null
function scheduleSave(t=1000) {
	if (saveTimeoutId !== null) { clearTimeout(saveTimeoutId) }
	saveTimeoutId = setTimeout(_saveSession, t)
}

$: {
	window._messages = data
	data = relationalToLinear(data)
	scheduleSave()
	document.title = `${sessionData.title} - Eimi LLM UI`
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

function getMessageFromEvent(event) {
	const id = event.target.closest('.message').dataset.id
	return data.find(i => i.id === id)
}

function getChain(message, regenerate=false) {
	const chain = []
	if (!regenerate) { chain.push(message) }
	let it = message
	while (1) {
		const parent = data.find(i => i.id === it.parentId)
		if (parent === undefined) { break }
		chain.unshift(parent)
		it = parent
	}
	return chain
}

function copyToClipboard(text) {
	if (!navigator.clipboard) { return }
	return navigator.clipboard.writeText(text)
}

async function onExportChain(event) {
	event.preventDefault()
	const message = getMessageFromEvent(event)
	const chain = getChain(message)
	const text = chain.map(i => i.content).join('\n-\n')
	copyToClipboard(text)
}

async function genResponse(event, regenerate=false, attemptNum=0) {
	event.preventDefault()
	const message = getMessageFromEvent(event)
	_genResponse(message, regenerate, attemptNum)
}
async function _genResponse(message, regenerate=false, attemptNum=0) {
	console.log('genResponse', message, regenerate, attemptNum)
	const chain = getChain(message, regenerate)

	let newMessage
	if (!regenerate) {
		newMessage = {
			id: uniqueId(),
			parentId: message.id,
			role: A,
			content: '',
			generating: true
		}
		data.unshift(newMessage)
	} else {
		message.content = ''
		message.generating = true
		newMessage = message
	}
	data = data
	await tick()

	if (regenerate && newMessage.aborter !== undefined) {
		newMessage.aborter.abort()
		await tick()
	}

	const aborter = new AbortController()
	newMessage.aborter = aborter
	try {
		const response = await fetch(
			'http://127.0.0.1:8000/chat_completions', {
				signal: aborter.signal,
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					token: localStorage["cfg-openai-token"],
					...sessionData.parameters,
					messages: chain.map(i => ({role: i.role, content: i.content}))
				})
			}
		)
		newMessage.tokenLen = parseInt(response.headers.get('x-token-len'), 10)
		newMessage.cropped = parseInt(response.headers.get('x-cropped'), 10)

		// TODO: generation cost
		if (sessionData.parameters.model === 'gpt-4') {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.03
		} else {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.002
		}

		const AUTO_ABORT_SUBSTRINGS = [
			"I'm sorry, but as an",
			'an AI language model',
			'OpenAI',
		]

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let text = ''
		while (true) {
			if (aborter.signal.aborted) break;
			const { done, value } = await reader.read()
			if (aborter.signal.aborted) break;
			if (done) { break }
			const decoded = decoder.decode(value, {stream: true})
			text += decoded

			if (attemptNum < 0) {  // disabled
				for (const s of AUTO_ABORT_SUBSTRINGS) {
					if (text.includes(s)) {
						aborter.abort()
						newMessage.generating = false
						data = data
						await tick()
						_genResponse(newMessage, true, attemptNum + 1)
						return
					}
				}
			}

			newMessage.content = text
			data = data
			await tick()
		}
	} catch (e) {
		console.error(e)
	} finally {
		newMessage.generating = false
		data = data
	}
}
onDestroy(() => {
	for (const item of data) {
		if (item.aborter !== undefined) {
			item.aborter.abort()
		}
	}
	saveSession(sessionId)
})

async function onReply(event) {
	event.preventDefault()
	const item = getMessageFromEvent(event)

	const newMessage = {
		id: uniqueId(),
		parentId: item.id,
		role: U,
		content: ''
	}
	data.unshift(newMessage)
	data = data
	await tick()
	const newEl = document.getElementById(`m_${newMessage.id}`)
	newEl.querySelector('textarea').focus()
}

async function onRoleChange(event) {
	const item = getMessageFromEvent(event)
	item.role = event.target.value
	scheduleSave(0)
}

async function deleteMessage(event) {
	event.preventDefault()
	if (!confirm('Are you sure?')) { return }
	const item = getMessageFromEvent(event)

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

async function onMessagesUpdate() {
	scheduleSave()
}

function onParametersUpdate(data) {
	sessionData.parameters = data
	scheduleSave()
}

function onTitleUpdate(event) {
	sessionData.title = event.target.value
	scheduleSave()
}

function onFork(event) {
	event.preventDefault()
	const newId = uniqueId()
	saveSession(newId)
	window.location.hash = `#${newId}`
}
function onDelete(event) {
	event.preventDefault()
	if (!confirm('Are you sure?')) { return }
	deleteSession()
	window.location.hash = ''
}
</script>

<main>
<Parameters
	parameters="{sessionData.parameters}"
	onUpdate="{onParametersUpdate}"
/>

<div class="sessions">
	{#each sessions as s}
		<a href={`#${s.key}`} title={s.message.content}>{s.title}</a>
	{/each}
</div>

<div>
	<input class="title-input" value={sessionData.title} on:input="{onTitleUpdate}" />
	<button on:click="{onFork}" title="make a copy of this session">fork</button>
	<button on:click="{onDelete}" title="delete session">x</button>
</div>

<div class="messages">
{#each data as c, i (c.id)}
	<div id={`m_${c.id}`} class="message" data-id="{c.id}" data-index="{i}" class:linear="{c.linear}">
		<div class="flex">
			{#each {length: c.ddepth} as _}
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
							<div class="meta-gray" title="Token length">{c.tokenLen} ${c.promptCost}</div>
						{/if}
						{#if c.cropped !== undefined && c.cropped > 0}
							<div class="meta-gray" title="Cropped messages">(M-{c.cropped})</div>
						{/if}
						<div class="ml-auto"></div>
						<button class="deleteButton" on:click="{deleteMessage}" title="delete this message and replies">x</button>
						<button class="gen" on:click="{onExportChain}" title="copy chain to clipboard">export</button>
						<button class="gen" on:click="{(e) => genResponse(e, true)}" title="regenerate this message">regen</button>
						<button class="gen" on:click="{(e) => genResponse(e, false)}" title="generate a response">gen</button>
						<button class="reply" on:click="{onReply}" title="create an empty reply">&#10149;&#xFE0E;</button>
					</div>
					<CustomInput value={c.content} obj={c} onUpdate="{onMessagesUpdate}" />
				</div>
				{#if c.linear && !c.lastInChain}<div class="linear-pad"></div>{/if}
				{#if c.lastInChain}<div class="linear-pad1"></div>{/if}
			</div>
		</div>
	</div>
{/each}
</div>
<div style="height: max(100vh, 2000px);"></div>
</main>

<style>
.sessions {
	position: absolute;
	left: 0;
}

.sessions a {
	color: var(--color-text);
	display: block;
	max-width: 20ch;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.title-input {
	width: 62ch;
}
.title-input {
	border: 1px solid var(--text-color);
	border-radius: 4px;
	padding: 2px;
	margin: 5px;
	background-color: var(--comment-bg-color);
	color: var(--text-color);
}
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

.linear-pad1 {
	margin-top: 30px;
	content: '';
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
