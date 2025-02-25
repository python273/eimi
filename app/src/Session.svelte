<script>
import { tick, onDestroy, onMount } from 'svelte';
import CustomInput from './lib/CustomInput.svelte';
import Parameters from './lib/Parameters.svelte';
import { uniqueId, genSessionId, subDbScripts, AsyncFunction } from './utils.js';
import { db } from './db.js';
import { hasCodeBlocks, createJsWindow } from './jsService/jsService';
import { runLlmApi } from './llms.js';
import MarkdownRenderer from './MarkdownRenderer.svelte';
import { CONFIG } from './config';

export let sessionId
export let autoReply
if (!sessionId) { throw new Error('sessionId is required') }

const U = 'user'
const A = 'assistant'
const S = 'system'

let sessionLoaded = false
let sessionData
/**
 * @type {Array<{
 *   id: string,
 *   createdAt?: number,
 *   parentId: string|null,
 *   role: string,
 *   content: string,
 *   markdown?: Boolean,
 *   depth?: number,
 *   ddepth?: number,
 *   linear?: boolean,
 *   lastInChain?: boolean,
 *   generating?: boolean,
 *   promptTokens?: number,
 *   completionTokens?: number,
 *   cropped?: number,
 *   aborter?: AbortController,
 * }>}
 */
let data

let stopSaving = false
async function saveSession(sessionId) {
	if (stopSaving) return;
	const savedMessages = data.map(
		({id, createdAt, parentId, role, content, markdown}) => ({
			id, createdAt, parentId, role, content, markdown
		})
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
			createdAt: new Date().valueOf(),
			parameters: {
				scriptsEnabled: (await (await db).getAll('scripts'))
										.filter(script => script.enabled)
										.map(script => script.id),
				temperature: 0,
				top_p: 1.0,
				frequency_penalty: 0,
				presence_penalty: 0
			},
			messages: [{
				id: uniqueId(),
				createdAt: new Date().valueOf(),
				parentId: null,
				role: U,
				content: ''
			}]
		}
		data = sessionData.messages
		sessionLoaded = true

		if (autoReply) {
			const modelsFav = CONFIG.models_favorite[0] || CONFIG.models[0];
			const modelDefault = CONFIG.models.filter(
				i => (i.api === modelsFav.api && i.id === modelsFav.id)
			)[0];

			sessionData.messages[0].content = autoReply
			sessionData.parameters = {
				...sessionData.parameters,
				_api: modelDefault.api,
				model: modelDefault.id,
				max_tokens: modelDefault.max_tokens,
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

let saveTimeoutId = null
let lastSaveTime = Date.now()
async function _saveSession() {
	await saveSession(sessionId)
	lastSaveTime = Date.now()
}
function scheduleSave(t = 500) {
	if (saveTimeoutId !== null) clearTimeout(saveTimeoutId);
	if ((Date.now() - lastSaveTime) >= 2000) {
		_saveSession();
	} else {
		saveTimeoutId = setTimeout(_saveSession, t)
	}
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

async function genResponse(event, regenerate=false) {
	event.preventDefault()
	const message = getMessageFromEvent(event)
	_genResponse(message, regenerate)
}
async function _genResponse(message, regenerate=false) {
	console.log('genResponse', message, regenerate, sessionData.parameters)
	const apiData = CONFIG.apis[sessionData.parameters._api];
	if (!apiData.token) {
		alert(`Add token in settings for "${sessionData.parameters._api}"`);
		throw Error('no token');
	}

	let newMessage
	if (!regenerate) {
		newMessage = {
			id: uniqueId(),
			createdAt: new Date().valueOf(),
			parentId: message.id,
			role: A,
			content: '',
			generating: true,
			markdown: true,
		}
		data.unshift(newMessage)
	} else {
		newMessage = message
	}
	newMessage.content = '';
	newMessage.generating = true;
	newMessage.promptTokens = undefined;
	newMessage.completionTokens = undefined;
	data = data
	await tick();

	let chain = getChain(message, regenerate)

	const scriptsEnabled = new Set(sessionData.parameters.scriptsEnabled || []);
	const orderedScriptsEnabled = scripts.filter(s => scriptsEnabled.has(s.id));

	console.log('Running scripts:', orderedScriptsEnabled.map(i => i.name));
	for (let script of orderedScriptsEnabled) {
		const fn = new AsyncFunction('chain', script.scriptChainProcess);
		let updatedChain;
		try {
			updatedChain = await fn(chain)
		} catch (e) {
			console.error(e);
			alert(`Script '${script.name}' error:\n${e}`);
			return
		}
		if (updatedChain != undefined) chain = updatedChain;
	}
	console.log('Chain after scripts:', chain);

	newMessage.aborter?.abort();
	const aborter = new AbortController()
	newMessage.aborter = aborter
	try {
		const request = {
			baseurl: apiData.baseurl,
			token: apiData.token,
			proxy: apiData.proxy === false ? false : true,
			signal: aborter.signal,
			messages: chain.map(i => ({role: i.role, content: i.content}))
		};
		[
			'model', 'completion',
			'temperature', 'frequency_penalty', 'presence_penalty',
			'max_tokens'
		].forEach(i => { request[i] = sessionData.parameters[i] })
		window._patchApiData && window._patchApiData(request);
		console.log('runLlmApi', request);

		newMessage.content = '';
		for await (const chunk of runLlmApi(request)) {
			if (typeof(chunk) === "string") {
				newMessage.content += chunk;
			} else {
				console.log(chunk);
				if (chunk?.usage?.prompt_tokens) {
					newMessage.promptTokens = chunk.usage.prompt_tokens;
				}
				if (chunk?.usage?.completion_tokens) {
					newMessage.completionTokens = chunk.usage.completion_tokens;
				}
			}
			data = data;
		}
	} catch (e) {
		if (e.name === 'AbortError') return;
		alert(`Request error:\n${e}`)
		console.error(e)
	}
	newMessage.generating = false
	data = data
}

async function onReply(event) {
	event.preventDefault()
	const item = getMessageFromEvent(event)

	const newMessage = {
		id: uniqueId(),
		createdAt: new Date().valueOf(),
		parentId: item.id,
		role: item.role === U ? A : U,
		content: '',
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
	const item = getMessageFromEvent(event)
	if (!item.parentId) return;
	if (!event.shiftKey && !confirm('Delete message?')) return;

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
	data = data;
	scheduleSave()
}

function onMessageKeyDown(event) {
	// Hotkeys:
	// Ctrl+Enter - gen response
	// Shift+Enter - reply
	// (textarea)+Esc - focus on message
	// R - regen
	// x / X - delete
	// j - down
	// k - up
	// A - focus on textarea
	// p - jump to parent
	if (event.target.tagName === 'TEXTAREA' && event.key === 'Escape') {
		event.preventDefault();
        event.target.closest('.message_content')?.focus({focusVisible: true});
		return;
	} else if ((event.metaKey || event.ctrlKey) && event.code === "Enter") {
		event.preventDefault();
		return genResponse(event);
	} else if (event.shiftKey && event.code === "Enter") {
		event.preventDefault();
		return onReply(event);
	}

	if (!event.target.classList.contains('message_content')) return;
	const item = getMessageFromEvent(event)

	if (event.key === 'R') {
		event.preventDefault();
		return genResponse(event, true);
	} else if (event.key === 'x' || event.key === 'X') {
		event.preventDefault();
		let i = data.findIndex(i => i.id == item.id) - 1;
		deleteMessage(event);
		if (i < 0) return;
		document.getElementById(`m_${data[i].id}`)
			?.querySelector('.message_content')
			?.focus({focusVisible: true});
	} else if (event.key === 'j' || event.key === 'k' || event.key === 'p') {
		event.preventDefault();
		let i;
		if (event.key === 'p') {
			i = data.findIndex(i => i.id == item.parentId);
		} else {
			i = data.findIndex(i => i.id == item.id) + (event.key === 'j' ? 1 : -1);
		}
		if (i < 0 || i >= data.length) return;
		const el = document.getElementById(`m_${data[i].id}`)
						?.querySelector('.message_content');
		if (!el) return;

		const rect = el.getBoundingClientRect();
		const isPartiallyOffscreen = rect.top < 0 || rect.bottom > window.innerHeight;
		if (isPartiallyOffscreen) el.scrollIntoView(true);
		el.focus({preventScroll: true, focusVisible: true});
	} else if (event.key === 'A') {
		event.preventDefault();
		const textarea = event.target.querySelector('textarea');
		textarea?.focus();
		textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
	}
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

async function onDup(event) {
	event.preventDefault()
	const newId = genSessionId()
	await saveSession(newId)
	window.location.hash = `#${newId}`
}
async function onDelete(event) {
	event.preventDefault()
	if (!event.shiftKey && !confirm('Delete session?')) { return }
	await deleteSession()
	window.location.hash = ''
}

let loadedPlugins = window.eimiPlugins || [];
function updateLoadedPlugins() {
	loadedPlugins = window.eimiPlugins || [];
}
onMount(() => { window.updateLoadedPlugins = updateLoadedPlugins; });
onDestroy(() => { window.updateLoadedPlugins = null; });

let scripts = [];
async function loadScripts() {
	const all = await (await db).getAll('scripts');
	let newScripts = all
		.filter(i => (!i.sessionId || i.sessionId === sessionId))
		.sort((a, b) => {
			if (!a.sessionId && b.sessionId) return -1;
			if (a.sessionId && !b.sessionId) return 1;
			return a.name.localeCompare(b.name);
		});
	scripts = newScripts;
}
loadScripts();
subDbScripts(loadScripts);
</script>

{#if !sessionLoaded}<div style="height: 20000px;"></div> <!-- scroll restoration -->{/if}

{#if sessionLoaded}
<Parameters
	sessionId="{sessionId}"
	parameters="{sessionData.parameters}"
	scripts={scripts}
	onUpdate="{onParametersUpdate}"
/>

<div>
	<input class="title-input" value={sessionData.title} on:input="{onTitleUpdate}" />
	<button on:click="{onDup}" title="make a copy of this session">dup</button>
	<button on:click="{onDelete}" title="delete session (hold shift)">delete</button>
</div>

<div class="messages">
{#each data as c, i (c.id)}
	<div id={`m_${c.id}`} class="message" data-id="{c.id}" data-index="{i}" class:linear="{c.linear}">
		<div class="flex">
			{#each {length: c.ddepth} as _}<div class='pad'></div>{/each}
			<div>
				<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="message_content" class:generating="{c.generating}" tabindex="0" on:keydown={onMessageKeyDown}>
					<div class="message_header">
						<select class="role" value={c.role} on:change="{onRoleChange}">
							<option value={A}>{A}</option>
							<option value={U}>{U}</option>
							<option value={S}>{S}</option>
						</select>
						<input type="checkbox" bind:checked={c.markdown} style="height: 0.85em;" title="Render Markdown"/>
						{#if c.promptTokens !== undefined}
							<div class="meta-gray mono pre" title="Prompt tokens">{String(c.promptTokens).padStart(5, ' ')}</div>
						{/if}
						{#if c.completionTokens !== undefined}
							<div class="meta-gray mono pre" title="Completion tokens">{String(c.completionTokens).padStart(5, ' ')}</div>
						{/if}
						{#if c.cropped !== undefined && c.cropped > 0}
							<div class="meta-gray" title="Cropped messages">(M-{c.cropped})</div>
						{/if}
						<div class="ml-auto"></div>

						{#each loadedPlugins as plugin}
							<button on:click="{async (e) => {
								if (plugin.onClick?.constructor.name === 'AsyncFunction') {
									await plugin.onClick(e, c);
								} else {
									plugin.onClick?.(e, c);
								}
								data = data;
							}}">{plugin.name}</button>
						{/each}

						{#if hasCodeBlocks(c.content)}
							<button
								on:click="{(e) => {
									e.preventDefault();
									createJsWindow(c);
								}}"
								title="run HTML / JavaScript">JS</button>
						{/if}
						{#if c.parentId !== null}
							<button on:click="{deleteMessage}" title="delete this message and replies (hold shift)">x</button>
						{/if}
						{#if c.role === A}
							<button on:click="{(e) => genResponse(e, true)}" title="regenerate this message">regen</button>
						{/if}
						<button on:click="{genResponse}" title="generate a response (ctrl+enter)">gen</button>
						<button on:click="{onReply}" title="create an empty reply (shift+enter)">&#10149;&#xFE0E;</button>
					</div>
					{#if c.markdown}
						<MarkdownRenderer generating={c.generating} content={c.content}/>
					{:else}
						<CustomInput
							generating={c.generating}
							value={c.content}
							obj={c}
							onUpdate="{onMessagesUpdate}"
						/>
					{/if}
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
	width: 40ch;
}
.role {
	background: none;
	border: none;
	color: var(--brand-color);
}
.role:hover {
	color: var(--brand-hover-color);
}

.pad {
	margin-right: 6px;
	width: 4px;
	max-width: 4px;
	min-width: 4px;
	content: '';
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
	margin-top: 1.5em;
	content: '';
}

.message_content {
	width: 62ch;
	margin: 1px 0;
	border-radius: 5px;
	background-color: var(--comment-bg-color);
	border: 1px solid var(--comment-bg-color);
	box-shadow: 0px 1px 6px #00000047;
}

.generating {
	border: 1px solid var(--brand-color);
}

.message_header * {
	text-decoration: none;
	white-space: nowrap;
}

.message_header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	font-size: 0.9em;
	margin: 0 0.6em;
}
</style>
