<script>
import { tick, onDestroy, onMount } from 'svelte';
import CustomInput from './lib/CustomInput.svelte';
import Parameters from './lib/Parameters.svelte';
import { uniqueId } from './utils.js';
import { db } from './db.js';

export let sessionId
export let autoReply
if (!sessionId) { throw new Error('sessionId is required') }

const CONFIG = JSON.parse(localStorage['cfg-config']);

const U = 'user'
const A = 'assistant'
const S = 'system'

let sessionLoaded = false
let sessionData
let data

let stopSaving = false
async function saveSession(sessionId) {
	if (stopSaving) return;
	const savedMessages = data.map(
		({id, parentId, role, content}) => ({id, parentId, role, content})
	)
	if (savedMessages.length === 1 && savedMessages[0].content === '') return;
	const obj = {...sessionData, messages: savedMessages};
	(await db).put('sessions', obj, sessionId);
	console.log('saved', sessionId)
}
onDestroy(async () => {
	if (!data) return;
	for (const item of data) {
		if (item.aborter !== undefined) {
			item.aborter.abort()
		}
	}
	await saveSession(sessionId)
})
async function deleteSession() {
	stopSaving = true;
	(await db).delete('sessions', sessionId);
	console.log('deleted', sessionId)
}

async function loadSession() {
	let obj = await (await db).get('sessions', sessionId);
	if (obj === undefined) {
		sessionData = {
			title: (new Date()).toLocaleString(),
			parameters: {},
			messages: [{id: 'genesis', parentId: null, role: U, content: ''}]
		}
		data = sessionData.messages
		sessionLoaded = true

		if (autoReply) {
			sessionData.messages[0].content = autoReply
			sessionData.parameters = {
				_api: "oai",
				temperature: 0,
				frequency_penalty: 0,
				presence_penalty: 0
			}
			autoReply = undefined
			_genResponse(data[0])
		}
		return
	}
	if (!obj.parameters) { obj.parameters = {} }
	sessionData = obj
	data = obj.messages
	sessionLoaded = true
}
onMount(() => {
	loadSession()
})

async function _saveSession() {
	await saveSession(sessionId)
}
let saveTimeoutId = null
function scheduleSave(t=1000) {
	if (saveTimeoutId !== null) { clearTimeout(saveTimeoutId) }
	saveTimeoutId = setTimeout(_saveSession, t)
}

$: {
	window._sessionData = sessionData
	if (data && data.length) {
		data = relationalToLinear(data)
		scheduleSave()
		document.title = `${sessionData.title} - Eimi LLM UI`
	}
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

async function genResponse(event, regenerate=false) {
	event.preventDefault()
	const message = getMessageFromEvent(event)
	_genResponse(message, regenerate)
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
		const url = (
			import.meta.env.DEV ?
				'http://127.0.0.1:8000/chat_completions' :
				'/chat_completions'
		)
		const apiData = CONFIG.apis[sessionData.parameters._api]
		const jsonBody = {
			baseurl: apiData.baseurl,
			token: apiData.token,
			messages: chain.map(i => ({role: i.role, content: i.content}))
		};
		[
			'model', 'temperature', 'frequency_penalty', 'presence_penalty',
			'target_token_len', 'max_tokens'
		].forEach(i => { jsonBody[i] = sessionData.parameters[i] })
		const response = await fetch(
			url, {
				signal: aborter.signal,
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(jsonBody)
			}
		)
		newMessage.tokenLen = parseInt(response.headers.get('x-token-len'), 10)
		newMessage.cropped = parseInt(response.headers.get('x-cropped'), 10)

		// TODO: generation cost
		if (sessionData.parameters.model.indexOf('gpt-4-32k') === 0) {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.06
		} else if (sessionData.parameters.model.indexOf('gpt-4') === 0) {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.03
		} else if (sessionData.parameters.model.indexOf('gpt-3.5-turbo-16k') === 0) {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.003
		} else if (sessionData.parameters.model.indexOf('gpt-3.5-turbo') === 0) {
			newMessage.promptCost = (newMessage.tokenLen / 1000) * 0.0015
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
	if (!confirm('Delete message?')) { return }
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
	console.log('Params:', data);
	sessionData.parameters = data
	scheduleSave()
}

function onTitleUpdate(event) {
	sessionData.title = event.target.value
	scheduleSave()
}

async function onFork(event) {
	event.preventDefault()
	const newId = uniqueId()
	await saveSession(newId)
	window.location.hash = `#${newId}`
}
async function onDelete(event) {
	event.preventDefault()
	if (!confirm('Delete session?')) { return }
	await deleteSession()
	window.location.hash = ''
}

let loadedPlugins = window.eimiPlugins || [];
function updateLoadedPlugins() {
	loadedPlugins = window.eimiPlugins || [];
}
onMount(() => {
	window.updateLoadedPlugins = updateLoadedPlugins;
});
onDestroy(() => {
	window.updateLoadedPlugins = null;
});
</script>

{#if sessionLoaded}
<Parameters
	parameters="{sessionData.parameters}"
	onUpdate="{onParametersUpdate}"
/>

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
							<option value={S}>{S}</option>
						</select>
						{#if c.tokenLen !== undefined && c.tokenLen > 0}
							<div class="meta-gray" title="Token length">{c.tokenLen} ${c.promptCost}</div>
						{/if}
						{#if c.cropped !== undefined && c.cropped > 0}
							<div class="meta-gray" title="Cropped messages">(M-{c.cropped})</div>
						{/if}
						<div class="ml-auto"></div>
						{#each loadedPlugins as plugin}
							<button on:click="{(e) => {plugin.onClick(e, c)}}">{plugin.name}</button>
						{/each}

						{#if c.parentId !== null}
							<button on:click="{deleteMessage}" title="delete this message and replies">x</button>
						{/if}
						<button on:click="{onExportChain}" title="copy chain to clipboard">export</button>
						{#if c.role === A}
							<button on:click="{(e) => genResponse(e, true)}" title="regenerate this message">regen</button>
						{/if}
						<button on:click="{genResponse}" title="generate a response (ctrl+enter)">gen</button>
						<button on:click="{onReply}" title="create an empty reply">&#10149;&#xFE0E;</button>
					</div>
					<CustomInput value={c.content} obj={c} onUpdate="{onMessagesUpdate}" onSubmit="{genResponse}"/>
				</div>
				{#if c.linear && !c.lastInChain}<div class="linear-pad"></div>{/if}
				{#if c.lastInChain}<div class="linear-pad1"></div>{/if}
			</div>
		</div>
	</div>
{/each}
</div>
{/if}

<style>
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
