<script>
import { tick, onDestroy, onMount } from 'svelte'
import CustomInput from './lib/CustomInput.svelte'
import Parameters from './lib/Parameters.svelte'
import {
  uniqueId, genSessionId, subDbScripts, notifySessionList, AsyncFunction,
  relationalToLinear
} from './utils.js'
import { db } from './db.js'
import { hasCodeBlocks, createJsWindow } from './jsService/jsService'
import { runLlmApi } from './llms.js'
import MarkdownRenderer from './MarkdownRenderer.svelte'
import { CONFIG } from './config.svelte'
import SessionHotkeys from './SessionHotkeys.svelte'
import { favoriteModels } from './lib/favoriteModelsStore'
import SessionFaviconChanger from './SessionFaviconChanger.svelte'

let props = $props()
const sessionId = props.sessionId  // https://github.com/sveltejs/svelte/issues/15697
let autoReply = props.autoReply
if (!sessionId) { throw new Error('sessionId is required') }

const USER = 'user'
const ASSISTANT = 'assistant'
const SYSTEM = 'system'

let sessionLoaded = $state(false)
let sessionData = $state()
/**
 * @type {Array<{
 *   id: string,
 *   createdAt?: number,
 *   parentId: string|null,
 *   role: string,
 *   content: string,
 *   thinking?: string,
 *   markdown?: Boolean,
 *   parameters?: object,
 *   depth?: number,
 *   ddepth?: number,
 *   linear?: boolean,
 *   lastInChain?: boolean,
 *   generating?: boolean,
 *   promptTokens?: number,
 *   completionTokens?: number,
 *   aborter?: AbortController,
 * }>}
 */
let messages = $state([])

let stopSaving = false
let isNewSession = false
async function saveSession(sessionId) {
  if (stopSaving) return
  if (!sessionLoaded) return
  if (isNewSession && messages.length === 1 && messages[0].content === '') {
    return
  }
  const obj = {...$state.snapshot(sessionData), messages: messages.map(
    ({id, createdAt, parentId,  markdown, role, content, thinking}) => ({
      id, createdAt, parentId,  markdown, role, content, thinking
    })
  )}
  await (await db).put('sessionMeta', {
    id: sessionId,
    title: obj.title,
    createdAt: obj.createdAt,
  })
  await (await db).put('sessions', obj, sessionId)
  if (isNewSession) {
    notifySessionList()
  }
  isNewSession = false
  console.log('saved', sessionId)
}
onDestroy(async () => {
  for (const i of messages) {
    i.aborter?.abort()
  }
  await saveSession(sessionId)
  stopSaving = true
})
async function deleteSession() {
  stopSaving = true
  const tx = (await db).transaction(['sessions', 'sessionMeta', 'scripts'], 'readwrite')
  await tx.objectStore('sessions').delete(sessionId)
  await tx.objectStore('sessionMeta').delete(sessionId)
  const allScripts = await tx.objectStore('scripts').getAll()
  for (const script of allScripts) {
    if (script.sessionId === sessionId) {
      await tx.objectStore('scripts').delete(script.id)
    }
  }
  await tx.done
  notifySessionList()
  console.log('deleted', sessionId)
}

async function loadSession() {
  let obj = await (await db).get('sessions', sessionId)
  if (obj === undefined) {
    isNewSession = true
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
      }
    }
    messages = relationalToLinear([{
      id: uniqueId(),
      createdAt: new Date().valueOf(),
      parentId: null,
      role: USER,
      content: ''
    }])
    sessionLoaded = true

    if (autoReply) {
      const modelsFav = $favoriteModels[0] || CONFIG.models[0]
      const modelDefault = CONFIG.models.filter(
        i => (i.api === modelsFav.api && i.id === modelsFav.id)
      )[0]

      messages[0].content = autoReply
      sessionData.parameters = {
        ...sessionData.parameters,
        _api: modelDefault.api,
        model: modelDefault.id,
        max_tokens: modelDefault.max_tokens,
      }
      autoReply = undefined
      _genResponse(messages[0])
    }
    await tick()
    document.getElementById(`m_${messages[0].id}`)?.querySelector('textarea')?.focus()
    return
  }
  const meta = await (await db).get('sessionMeta', sessionId)
  obj.title = meta.title
  obj.createdAt = meta.createdAt
  if (!obj.parameters) { obj.parameters = {} }
  const {messages: loadedMessages, ...rest} = obj
  sessionData = rest
  messages = relationalToLinear(loadedMessages)
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
  if (saveTimeoutId !== null) clearTimeout(saveTimeoutId)
  if ((Date.now() - lastSaveTime) >= 2000) {
    t = 0
  }
  saveTimeoutId = setTimeout(_saveSession, t)
}

$effect(() => {
  window._sessionInfo = sessionData
  if (sessionData) {
    document.title = `${sessionData.title} - Eimi LLM UI`
  }
})
$effect(() => {
  for (let i of messages) {  // TODO: is there a better way?
    i.role
    i.content
    i.markdown
  }
  window._sessionMessages = messages
  scheduleSave()
})

function getMessageFromEvent(event) {
  const el = event.target.closest('.message')
  if (!el) { return }
  const id = el.dataset.id
  return messages.find(i => i.id === id)
}

function getChain(message, regenerate = false) {
  const chain = regenerate ? [] : [message]
  while (message = messages.find(p => p.id === message.parentId)) {
    chain.unshift(message)
  }
  return chain
}

async function genResponse(event, regenerate=false) {
  event.preventDefault()
  const message = getMessageFromEvent(event)
  _genResponse(message, regenerate)
}
async function _genResponse(message, regenerate=false) {
  console.log(
    'genResponse', $state.snapshot(message), regenerate,
    $state.snapshot(sessionData.parameters))
  const apiData = CONFIG.apis[sessionData.parameters._api]
  if (!apiData.token) {
    alert(`Add token in settings for "${sessionData.parameters._api}"`)
    throw Error('no token')
  }
  const modelInfo = CONFIG.models.find(i => (
    i.api === sessionData.parameters._api
    && i.id === sessionData.parameters.model))

  if (location.hostname === 'eimi.cns.wtf') {
    fetch('https://ut.cns.wtf/api/record/eimi_gen')
  }

  let newMessage
  if (!regenerate) {
    messages.unshift({
      id: uniqueId(),
      createdAt: new Date().valueOf(),
      parentId: message.id,
      role: ASSISTANT,
      content: '',
      thinking: '',
      generating: true,
      markdown: true,
      parameters: {...sessionData.parameters},
    })
    newMessage = messages[0]  // get msg with Svelte proxy
    messages = relationalToLinear(messages)
  } else {
    newMessage = message
    newMessage.content = ''
    newMessage.thinking = ''
    newMessage.generating = true
    newMessage.promptTokens = undefined
    newMessage.completionTokens = undefined
    newMessage.parameters = {...sessionData.parameters}
  }
  newMessage.aborter?.abort()
  const aborter = new AbortController()
  newMessage.aborter = aborter
  await tick()

  const request = {
    signal: aborter.signal,
    proxy: apiData.proxy === false ? false : true,
    baseurl: apiData.baseurl,
    token: apiData.token,
    model: sessionData.parameters.model,
    completion: modelInfo.completion,
    parameters: {
      temperature: sessionData.parameters.temperature,
      frequency_penalty: sessionData.parameters.frequency_penalty,
      presence_penalty: sessionData.parameters.presence_penalty,
    },
    messages: getChain(message, regenerate).map(({role, content}) => ({role, content})),
  }
  if (sessionData.parameters._api === 'anthropic' && sessionData.parameters.max_tokens === 0) {
    request.parameters.max_tokens = modelInfo.max_tokens
  } else if (sessionData.parameters.max_tokens !== 0) {
    request.parameters.max_tokens = sessionData.parameters.max_tokens
  }

  console.log('runLlmApi before scripts:', {
    ...request,
    parameters: JSON.parse(JSON.stringify(request.parameters)),
    messages: JSON.parse(JSON.stringify(request.messages)),
  })

  const scriptsEnabled = new Set(sessionData.parameters.scriptsEnabled || [])
  const orderedScriptsEnabled = scripts.filter(s => scriptsEnabled.has(s.id))

  console.log('Running scripts:', orderedScriptsEnabled.map(i => i.name))
  for (let script of orderedScriptsEnabled) {
    const fn = new AsyncFunction('request', script.scriptChainProcess)
    try {
      await fn(request)
    } catch (e) {
      console.error(e)
      console.log('runLlmApi after script error:', request)
      alert(`Script '${script.name}' error:\n${e}`)
      newMessage.generating = false
      return
    }
  }
  console.log('runLlmApi after scripts:', request)

  try {
    newMessage.content = ''
    for await (const chunk of runLlmApi(request)) {
      if (typeof(chunk) === "string") {
        newMessage.content += chunk
      } else {
        if (chunk?.usage?.prompt_tokens) {
          newMessage.promptTokens = chunk.usage.prompt_tokens
        }
        if (chunk?.usage?.completion_tokens) {
          newMessage.completionTokens = chunk.usage.completion_tokens
        }
        if (chunk?.thinking) {
          newMessage.thinking += chunk.thinking
        }
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') return
    alert(`Request error:\n${e}`)
    console.error(e)
  }
  newMessage.generating = false
}

async function onCreateMessage(event) {
  event.preventDefault()
  const parentMsg = getMessageFromEvent(event)

  const newMessage = {
    id: uniqueId(),
    createdAt: new Date().valueOf(),
    parentId: parentMsg ? parentMsg.id : null,
    role: parentMsg ? (parentMsg.role === USER ? ASSISTANT : USER) : USER,
    content: '',
  }
  if (parentMsg) {
    messages.unshift(newMessage)
  } else {
    messages.push(newMessage)
  }
  messages = relationalToLinear(messages)
  await tick()
  const newEl = document.getElementById(`m_${newMessage.id}`)
  newEl.querySelector('textarea').focus()
}

async function onRoleChange(event) {
  const msg = getMessageFromEvent(event)
  msg.role = event.target.value
  scheduleSave()
}

async function deleteMessage(event) {
  event.preventDefault()
  const msg = getMessageFromEvent(event)
  if (!event.shiftKey && !confirm('Delete message?')) return

  const idsToDelete = [msg.id]
  function _addChildren(msg) {
    const children = messages.filter(i => i.parentId === msg.id)
    for (const child of children) {
      idsToDelete.push(child.id)
      _addChildren(child)
    }
  }
  _addChildren(msg)

  messages = relationalToLinear(messages.filter(i => !idsToDelete.includes(i.id)))
  scheduleSave(0)
}

function onParametersUpdate(newParameters) {
  console.log('Params:', newParameters)
  sessionData.parameters = newParameters
  scheduleSave()
}

async function onTitleUpdate(event) {
  sessionData.title = event.target.value
  await (await db).put('sessionMeta', {
    id: sessionId,
    title: sessionData.title,
    createdAt: sessionData.createdAt,
  })
  notifySessionList()
  scheduleSave(200)
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

let loadedPlugins = $state(window.eimiPlugins || [])
function updateLoadedPlugins() {
  loadedPlugins = window.eimiPlugins || []
}
onMount(() => { window.updateLoadedPlugins = updateLoadedPlugins })
onDestroy(() => { window.updateLoadedPlugins = null })

let scripts = $state([])
async function loadScripts() {
  const all = await (await db).getAll('scripts')
  let newScripts = all
    .filter(i => (!i.sessionId || i.sessionId === sessionId))
    .sort((a, b) => (a.name.localeCompare(b.name)))
  scripts = newScripts
}
loadScripts()
subDbScripts(loadScripts)
</script>

{#if sessionLoaded}
<SessionFaviconChanger {messages} />

<Parameters
  {sessionId}
  parameters={sessionData.parameters}
  {scripts}
  onUpdate={onParametersUpdate}
/>

<div>
  <input class="title-input" value={sessionData.title} oninput={onTitleUpdate} />
  <button onclick={onDup} title="make a copy of this session">dup</button>
  <button onclick={onDelete} title="delete session (hold shift)">delete</button>
</div>
<SessionHotkeys {messages} {genResponse} {onCreateMessage} {getMessageFromEvent} {deleteMessage}/>

<div id="messages" class="messages">
{#each messages as c, i (c.id)}
  <div id={`m_${c.id}`} class="message" data-id="{c.id}" data-index="{i}" class:linear="{c.linear}">
    <div class="flex">
      {#each {length: c.ddepth} as _}<div class='pad'></div>{/each}
      <div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="message-content" class:generating="{c.generating}" tabindex="0">
          <div class="message-header">
            <select class="role" value={c.role} onchange={onRoleChange}>
              <option value={ASSISTANT}>{ASSISTANT}</option>
              <option value={USER}>{USER}</option>
              <option value={SYSTEM}>{SYSTEM}</option>
            </select>
            {#if c.markdown}
              <button onclick={() => { c.markdown = false }}>edit</button>
            {:else}
              <button onclick={() => { c.markdown = true }} title="Markdown">md</button>
            {/if}
            {#if c.parameters?.model}
              <div class="meta-gray mono pre meta-model">{c.parameters?.model}</div>
            {/if}
            {#if c.promptTokens !== undefined}
              <div class="meta-gray mono pre" title="Prompt tokens">{String(c.promptTokens).padStart(5, ' ')}</div>
            {/if}
            {#if c.completionTokens !== undefined}
              <div class="meta-gray mono pre" title="Completion tokens">{String(c.completionTokens).padStart(5, ' ')}</div>
            {/if}
            <div class="ml-auto"></div>

            {#each loadedPlugins as plugin}
              <button onclick={async (e) => { plugin.onClick(e, c) }}>{plugin.name}</button>
            {/each}

            {#if hasCodeBlocks(c.content)}
              <button
                onclick={(e) => {
                  e.preventDefault()
                  createJsWindow(c)
                }}
                title="run HTML / JavaScript">JS</button>
            {/if}
            <button onclick={deleteMessage} title="delete this message and replies (hold shift)" aria-label="Delete">
              x
            </button>
            {#if c.role === ASSISTANT}
              <button onclick={(e) => genResponse(e, true)} title="regenerate this message">regen</button>
            {/if}
            <button onclick={genResponse} title="generate a response (ctrl+enter)">gen</button>
            <button onclick={onCreateMessage} title="create an empty reply (shift+enter)">&#10149;&#xFE0E;</button>
          </div>
          {#if c.thinking}
            <details style="margin: 0 0.6em 5px 0.6em;border-radius: 5px;">
              <summary>Thinking</summary>
              <CustomInput
                generating={c.generating}
                value={c.thinking}
                bind:message={messages[i]}
                attr='thinking'
                style="border: 1px solid var(--text-color);"
              />
            </details>
          {/if}
          {#if c.markdown}
            <MarkdownRenderer generating={c.generating} content={c.content}/>
          {:else}
            <CustomInput
              generating={c.generating}
              value={c.content}
              bind:message={messages[i]}
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
<button
  class="create-top-msg-btn"
  onclick={onCreateMessage}
  title="create top level message"
  type="button">＋&#xFE0E;</button>
{:else}
<div id="messages" class="messages"></div>
<div id="scroll-restoration" style="height: 50000px;"></div>
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

.message-content {
  width: 64ch;
  margin: 1px 0;
  border-radius: 5px;
  background-color: var(--comment-bg-color);
  border: 1px solid var(--comment-bg-color);
  box-shadow: 0px 1px 6px #00000047;
}

.message-content:focus, .message-content:focus-visible {
  outline: 1px auto;
}

.generating {
  border: 1px solid var(--brand-color);
}

.message-header * {
  text-decoration: none;
  white-space: nowrap;
}

.message-header {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  font-size: 0.9em;
  margin: 0 0.6em;
}

.role {
  margin: 0;
  padding: 0;
}

.meta-model {
  overflow-x: auto;
}

.create-top-msg-btn {
  width: 4em;
  height: 2em;
  background: var(--comment-bg-color);
  color: var(--text-color);
  opacity: 0.4;
  border-radius: 5px;
}
</style>
