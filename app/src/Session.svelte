<script>
import { tick, onDestroy, onMount } from 'svelte'
import CustomInput from './lib/CustomInput.svelte'
import Parameters from './lib/Parameters.svelte'
import {
  uniqueId, genSessionId, notifySessionList, relationalToLinear, omit,
  mergeOpenaiDiff
} from './utils.js'
import { db } from './db.js'
import { hasCodeBlocks, createJsWindow } from './jsService/jsService'
import { runLlmApi } from './llms.js'
import MarkdownRenderer from './MarkdownRenderer.svelte'
import { CONFIG } from './config.svelte'
import SessionHotkeys from './SessionHotkeys.svelte'
import SessionFaviconChanger from './SessionFaviconChanger.svelte'
import SessionScripts from './SessionScripts.svelte'


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
 *   collapsed?: Boolean,
 *   parameters?: object,
 *   customData?: Array<{key: string, value: string}>,
 *   depth?: number,
 *   ddepth?: number,
 *   linear?: boolean,
 *   lastInChain?: boolean,
 *   generating?: boolean,
 *   promptTokens?: number,
 *   completionTokens?: number,
 *   finishReason?: string,
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
    ({id, createdAt, parentId,  markdown, role, content, thinking, customData, parameters, collapsed}) => ({
      id, createdAt, parentId,  markdown, role, content, thinking,
      customData: $state.snapshot(customData),
      parameters: $state.snapshot(parameters),
      collapsed,
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
}
onDestroy(async () => {
  for (const i of messages) {
    i.aborter?.abort()
  }
  for (const instance of Object.values(scriptInstances)) {
    if (instance.onDestroy) {
      try {
        await instance.onDestroy()
      } catch (e) {
        console.error('Script onDestroy error:', e)
        alert(`Script onDestroy error:\n${e}`)
      }
    }
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
        presence_penalty: 0,
        max_tokens: 0,
      }
    }
    createMessage()
    sessionLoaded = true
    await tick()

    if (autoReply) {
      messages[0].content = autoReply
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
  for (let m of loadedMessages) {
    if (!m.customData) m.customData = []
  }
  sessionData = rest
  messages = relationalToLinear(loadedMessages)
  sessionLoaded = true
}

onMount(async () => {
  await loadSession()
  const savedScrollY = sessionStorage.getItem(`scroll-${sessionId}`)
  if (savedScrollY) {
    await tick()
    window.scrollTo(0, parseInt(savedScrollY, 10))
  }
})

onMount(() => {
  // TODO: probably better to just save before navigation
  const saveScroll = () => {
    sessionStorage.setItem(`scroll-${sessionId}`, window.scrollY.toString())
  }
  let saveScrollTimeoutId = undefined
  const handleScroll = () => {
    clearTimeout(saveScrollTimeoutId)
    saveScrollTimeoutId = setTimeout(saveScroll, 200)
  }
  window.addEventListener('beforeunload', saveScroll)
  window.addEventListener('scroll', handleScroll)
  return () => {
    clearTimeout(saveScrollTimeoutId)
    window.removeEventListener('beforeunload', saveScroll)
    window.removeEventListener('scroll', handleScroll)
  }
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
  sessionData?.title
  Object.keys(sessionData?.parameters || {})
  for (let i of messages) {  // TODO: is there a better way?
    i.role
    i.content
    i.markdown
    i.collapsed
    i.customData?.forEach(d => d.value)
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
  // eslint-disable-next-line no-cond-assign
  while (message = messages.find(p => p.id === message.parentId)) {
    chain.unshift(message)
  }
  return chain
}

function createMessage(values, index = 0) {
  const newMessage = {
    id: uniqueId(),
    createdAt: new Date().valueOf(),
    parentId: null,
    role: USER,
    content: '',
    thinking: '',
    generating: false,
    markdown: false,
    customData: [],
    ...values
  }
  
  const insertIndex = index === -1 ? messages.length : index
  messages.splice(insertIndex, 0, newMessage)
  const messageWithProxy = messages[insertIndex]
  messages = relationalToLinear(messages)
  return messageWithProxy
}

function apiGenResponse(messageId, paramsReplace) {
  const message = messages.find(m => m.id === messageId)
  if (message) {
    return _genResponse(message, false, paramsReplace)
  }
}
async function genResponse(event, regenerate=false) {
  event.preventDefault()
  const message = getMessageFromEvent(event)
  _genResponse(message, regenerate)
}
async function _genResponse(message, regenerate=false, paramsReplace) {
  const params = paramsReplace || $state.snapshot(sessionData.parameters)
  console.log('_genResponse', $state.snapshot(message), regenerate, params)

  const apiData = CONFIG.apis[params._api]
  if (!apiData.token) {
    alert(`Add token in settings for "${params._api}"`)
    throw Error('no token')
  }
  const modelInfo = CONFIG.models.find(i => (i.api === params._api && i.id === params.model))

  if (location.hostname === 'eimi.cns.wtf') {
    fetch('https://ut.cns.wtf/api/record/ei'+' mi_gen'.trim())
  }

  let newMessage
  if (!regenerate) {
    newMessage = createMessage({
      parentId: message.id,
      role: ASSISTANT,
      generating: true,
      markdown: true,
      parameters: {...params},
    })
  } else {
    newMessage = message
    newMessage.content = ''
    newMessage.thinking = ''
    newMessage.generating = true
    newMessage.promptTokens = undefined
    newMessage.completionTokens = undefined
    newMessage.parameters = {...params}
  }
  newMessage.aborter?.abort()
  const aborter = new AbortController()
  newMessage.aborter = aborter
  await tick()

  const request = {
    createdAt: new Date(),
    runner: runLlmApi,
    signal: aborter.signal,
    proxy: apiData.proxy === false ? false : true,
    baseurl: apiData.baseurl,
    token: apiData.token,
    model: params.model,
    completion: modelInfo.completion,
    sessionParameters: params,
    parameters: omit(params, ['_api', 'model', 'scriptsEnabled', 'max_tokens']),
    messages: getChain(message, regenerate).map(({id, role, thinking, content}) => ({
      _id: id, role, _thinking: thinking, content: [{type: 'text', text: content}]
    })),
  }
  if (params._api === 'anthropic' && params.max_tokens === 0) {
    request.parameters.max_tokens = modelInfo.max_tokens
  } else if (params.max_tokens !== 0) {
    request.parameters.max_tokens = params.max_tokens
  }

  console.log('runLlmApi before scripts:', {
    ...request,
    parameters: JSON.parse(JSON.stringify(request.parameters)),
    messages: JSON.parse(JSON.stringify(request.messages)),
  })

  const scriptsEnabled = new Set(params.scriptsEnabled || [])
  const orderedScriptsEnabled = scripts.filter(s => scriptsEnabled.has(s.id))

  console.log('Running scripts:', orderedScriptsEnabled.map(i => i.name))
  for (let script of orderedScriptsEnabled) {
    try {
      const instance = scriptInstances[script.id]
      if (instance?.onRequest) {
        await instance.onRequest(request, newMessage, messages)
      }
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
    const tool_calls = []
    newMessage.content = ''
    for await (const chunk of request.runner(request)) {
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
        if (chunk?.tool_call_delta) {
          const { index, ...diff } = chunk.tool_call_delta
          if (tool_calls[index] === undefined) tool_calls[index] = {}
          const accumulated_tool_call = tool_calls[index]
          mergeOpenaiDiff(accumulated_tool_call, diff)

          const key = `toolcall_${index}`
          let tcData = newMessage.customData.find(d => d.key === key)
          if (!tcData) {
            tcData = {key: key, value: ''}
            newMessage.customData.push(tcData)
          }
          tcData.value = JSON.stringify(accumulated_tool_call, null, 2)
        }
        if (chunk?.finishReason) newMessage.finishReason = chunk.finishReason
      }
      await tick()
    }
  } catch (e) {
    if (e.name === 'AbortError') return
    console.error(e)
    alert(`Request error:\n${e}`)
  } finally {
    newMessage.generating = false
    const scriptsEnabled = new Set(sessionData.parameters.scriptsEnabled || [])
    for (const script of scripts) {
      if (!scriptsEnabled.has(script.id)) continue
      const instance = scriptInstances[script.id]
      if (instance && instance.onPostRequest) {
        try {
          await instance.onPostRequest(request, newMessage)
        } catch (e) {
          console.error(`onPostRequest error for script '${script.name}':`, e)
          alert(`onPostRequest error for script '${script.name}':\n${e}`)
        }
      }
    }
  }
  return {newMessage, request}
}

async function onCreateMessage(event) {
  event.preventDefault()
  const parentMsg = getMessageFromEvent(event)

  const newMessage = createMessage({
    parentId: parentMsg ? parentMsg.id : null,
    role: parentMsg ? (parentMsg.role === USER ? ASSISTANT : USER) : USER,
  }, parentMsg ? 0 : -1)
  await tick()
  const newEl = document.getElementById(`m_${newMessage.id}`)
  newEl.querySelector('textarea').focus()
}

async function onRoleChange(event) {
  const msg = getMessageFromEvent(event)
  msg.role = event.target.value
}

function onCollapseToggle(event, message) {
  const newState = !message.collapsed
  message.collapsed = newState
  if (event.shiftKey) {
    function toggleChildren(msgId, childState) {
      const children = messages.filter(i => i.parentId === msgId)
      for (const child of children) {
        child.collapsed = childState
        toggleChildren(child.id, childState)
      }
    }
    toggleChildren(message.id, newState)
  }
}

async function deleteMessage(event) {
  event.preventDefault()
  const msg = getMessageFromEvent(event)
  if (!event.shiftKey && !confirm('Delete message?')) return

  msg.aborter?.abort()
  await tick()

  const idsToDelete = [msg.id]
  function _addChildren(msg) {
    const children = messages.filter(i => i.parentId === msg.id)
    for (const child of children) {
      child.aborter?.abort()
      idsToDelete.push(child.id)
      _addChildren(child)
    }
  }
  _addChildren(msg)

  messages = relationalToLinear(messages.filter(i => !idsToDelete.includes(i.id)))
  scheduleSave(0)
}

async function onTitleUpdate(event) {
  sessionData.title = event.target.value
  await (await db).put('sessionMeta', {
    id: sessionId,
    title: sessionData.title,
    createdAt: sessionData.createdAt,
  })
  notifySessionList()
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
let scriptInstances = $state({})

async function moveMessage(messageId, direction) {
  const currentIndex = messages.findIndex(m => m.id === messageId)
  const current = messages[currentIndex]

  if (direction === 'up') {
    if (currentIndex === 0) return
    const up = messages[currentIndex - 1]
    if (up.id === current.parentId) {
      // Case 1: up is shallower (is parent), becoming sibling and moving higher
      current.parentId = up.parentId
      messages[currentIndex - 1] = current
      messages[currentIndex] = up
    } else {
      // Case 2: up is same depth, set as parent
      // Case 3: up is deeper, drill up till same depth
      let i = currentIndex - 1
      while (i >= 0 && messages[i].depth > current.depth) i--
      current.parentId = messages[i].id
    }
  } else if (direction === 'down') {
    // Drilling past children
    let i = currentIndex + 1
    while (i < messages.length && messages[i].depth > current.depth) i++
    const down = messages[i]
    if (down?.depth === current.depth) {
      // Case 4: down is same depth, set as parent
      current.parentId = down.id
    } else {
      // Case 5: down is shallower OR end of messages, set parent to .parent.parent
      const parent = messages.find(m => m.id === current.parentId)
      current.parentId = parent ? parent.parentId : null
    }
  }

  messages = relationalToLinear(messages)
  await tick()
  document.getElementById(`m_${current.id}`)
    ?.querySelector('.message-content')
    ?.focus({focusVisible: true})
}
</script>

{#if sessionLoaded}
<SessionFaviconChanger {messages} />
<SessionHotkeys {messages} {genResponse} {onCreateMessage} {getMessageFromEvent} {deleteMessage} {moveMessage}/>
<SessionScripts
  {sessionId}
  {messages}
  bind:scripts={scripts}
  bind:scriptInstances={scriptInstances}
  scriptsEnabled={sessionData.parameters.scriptsEnabled}
  {apiGenResponse}
  {sessionData}
  {createMessage}
/>

<Parameters
  {sessionId}
  bind:parameters={sessionData.parameters}
  {scripts}
/>

<div>
  <input class="title-input" value={sessionData.title} oninput={onTitleUpdate} />
  <button onclick={onDup} title="make a copy of this session">dup</button>
  <button onclick={onDelete} title="delete session (hold shift)">delete</button>
</div>

{#snippet renderMessage(c, i)}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="message-content" class:generating="{c.generating}" tabindex="0">
    <div class="message-header">
      <button class="mono" onclick={(e) => { onCollapseToggle(e, c) }} title="collapse (shift+click to toggle all children)">
        {#if c.collapsed}[+]{:else}[-]{/if}
      </button>
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
      <button onclick={onCreateMessage} title="create an empty reply (message focus+n)">&#10149;&#xFE0E;</button>
    </div>
    {#if !c.collapsed}
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
      {#if c.customData}
        {#each c.customData as item, index (item)}
          <details style="margin: 0 0.6em 5px 0.6em;border-radius: 5px;">
            <summary>
              {item.key}
              <button
                onclick={(e) => {
                  e.preventDefault()
                  c.customData.splice(index, 1)
                }}
                title="Remove field"
              >x</button>
            </summary>
            <CustomInput
              generating={c.generating}
              value={item.value}
              bind:message={c.customData[index]}
              attr='value'
              style="border: 1px solid var(--text-color);"
            />
          </details>
        {/each}
      {/if}
    {/if}
  </div>
{/snippet}

<div id="messages" class="messages">
{#each messages as c, i (c.id)}
  <div id={`m_${c.id}`} class="message message-pad" data-id="{c.id}" data-index="{i}" class:linear="{c.linear}" style="--depth: {c.ddepth}">
    {@render renderMessage(c, i)}
    {#if c.linear && !c.lastInChain}<div class="linear-pad"></div>{/if}
  </div>
  {#if c.lastInChain /* outside of message so anti layout shift works */}
    <div class="pad-chain-end message-pad" style="--depth: {c.ddepth}"></div>
  {/if}
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

.message {
  position: relative;
  padding-left: calc(var(--depth) * 10px);
}

.message-pad::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: -1px;
  width: calc(var(--depth) * 10px);
  background: repeating-linear-gradient(
    90deg,
    var(--text-color) 0px 4px,
    transparent 4px 10px
  );
}

.linear-pad {
  width: 5px;
  height: 4px;
  margin-left: 14px;
  content: '';
  background-color: var(--text-color);
}

.pad-chain-end {
  position: relative;
  height: 1.5em;
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

.message-content.full-width {
  width: 100%;
  height: 100%;
  border: none;
  box-shadow: none;
  margin: 0;
  border-radius: 0;
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
