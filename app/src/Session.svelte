<script>
import { tick, onDestroy, onMount } from 'svelte'
import CustomInput from './lib/CustomInput.svelte'
import CustomInputPopover from './lib/CustomInputPopover.svelte'
import Parameters from './lib/Parameters.svelte'
import { genSessionId, openEmptySession } from './utils.js'
import { hasCodeBlocks, createJsWindow } from './jsService/jsService'
import MarkdownRenderer from './MarkdownRenderer.svelte'
import SessionHotkeys from './SessionHotkeys.svelte'
import Collapsible from './lib/Collapsible.svelte'
import SessionFaviconChanger from './SessionFaviconChanger.svelte'
import { SessionState, USER, ASSISTANT, SYSTEM } from './SessionState.svelte.js'


let props = $props()
const sessionId = props.sessionId  // https://github.com/sveltejs/svelte/issues/15697
const autoReply = props.autoReply
const windowState = props.state
if (!sessionId) { throw new Error('sessionId is required') }

const sessionState = new SessionState({ sessionId, autoReply })
const sessionScripts = sessionState.sessionScripts
let sessionLoaded = $derived(sessionState.sessionLoaded)
let sessionData = $derived(sessionState.sessionData)
let messages = $derived(sessionState.messages)
let layoutLoaded = $state(false)
let messageStats = $derived.by(() => {
  const cnt = messages.length
  let roots = 0
  let leafs = 0
  const hasChild = new Set()
  for (const m of messages) if (m.parentId) hasChild.add(m.parentId)
  for (const m of messages) {
    if (!m.parentId) roots++
    if (!hasChild.has(m.id)) leafs++
  }
  return {cnt, roots, leafs}
})

onMount(async () => {
  await sessionState.loadSession()
  windowState?.loadSessionLayout(sessionState.sessionData?.windowLayout)
  layoutLoaded = true
  const savedScrollY = sessionStorage.getItem(`scroll-${sessionId}`)
  if (savedScrollY) {
    await tick()
    window.scrollTo(0, parseInt(savedScrollY, 10))
  }
  if (sessionState.isNewSession && messages[0]) {
    await tick()
    document.getElementById(`m_${messages[0].id}`)?.querySelector('textarea')?.focus()
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

onDestroy(async () => {
  if (sessionState.sessionData) sessionState.sessionData.windowLayout = windowState?.getSessionLayout()
  await sessionState.destroy()
})

$effect(() => {
  if (sessionData) document.title = `${sessionData.title} - Eimi LLM UI`
})

$effect(() => {
  if (!layoutLoaded || !sessionLoaded || !sessionData || !windowState) return
  sessionData.windowLayout = windowState.getSessionLayout()
})

function getMessageFromEvent(event) {
  const el = event.target.closest('.message')
  if (!el) { return }
  const id = el.dataset.id
  return messages.find(i => i.id === id)
}

function getCommandLineInfoFromEl(el, message) {
  if (!el || el.tagName !== 'TEXTAREA') return
  const text = el.value ?? message?.content ?? ''
  const cursor = typeof el.selectionStart === 'number' ? el.selectionStart : text.length
  const lineStart = text.lastIndexOf('\n', cursor - 1) + 1
  let lineEnd = text.indexOf('\n', cursor)
  if (lineEnd === -1) lineEnd = text.length
  const line = text.slice(lineStart, lineEnd)
  return {line, lineStart, lineEnd, cursor, text, inputEl: el}
}

function setCmdError(message, text) {
  if (message._cmdErrTimer) clearTimeout(message._cmdErrTimer)
  message.cmdError = text
  if (!text) return
  message._cmdErrTimer = setTimeout(() => {
    if (message.cmdError === text) message.cmdError = ''
    message._cmdErrTimer = null
  }, 500)
}

function updateCommandAssist(message) {
  const lineInfo = getCommandLineInfoFromEl(message.inputEl, message)
  if (!lineInfo || !lineInfo.line.startsWith('/')) {
    message.cmdMatches = []
    return
  }
  const token = lineInfo.line.slice(1).split(/\s/)[0]
  message.cmdMatches = sessionScripts.availableCommands.filter(c => !token || c.startsWith(token))
}

$effect(() => {
  sessionScripts.availableCommands
  for (const m of messages) if (m.inputEl) updateCommandAssist(m)
})

async function runCommandFromEvent(event, message) {
  const lineInfo = getCommandLineInfoFromEl(event?.target, message)
  if (!lineInfo) return
  const match = lineInfo.line.match(/^\/([a-zA-Z0-9-]+)(?:\s|$)/)
  if (!match) return

  const args = lineInfo.line.slice(match[0].length).replace(/^\s+/, '')
  return sessionScripts.runCommand({command: match[1], args, message, lineInfo})
}

function getChain(message, regenerate = false) {
  return sessionState.getChain(message, regenerate)
}

async function genResponse(event, regenerate=false) {
  event.preventDefault()
  const message = getMessageFromEvent(event)
  if (!message) return
  if (!regenerate) {
    // TODO: decouple from genResponse! checks for textarea focus currently
    const cmdResult = await runCommandFromEvent(event, message)
    if (cmdResult) {
      if (cmdResult.noMatch) setCmdError(message, '(No cmd matched)')
      if (cmdResult.next === 'gen') {
        return sessionState.genResponse(message, regenerate, undefined, cmdResult.scriptsData)
      }
      return
    }
  }
  return sessionState.genResponse(message, regenerate)
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
  if (!msg) return
  if (!event.shiftKey && !confirm('Delete message?')) return
  await sessionState.deleteMessageTree(msg.id)
}

async function onTitleUpdate(event) {
  await sessionState.setTitle(event.target.value)
}

async function onDup(event) {
  event.preventDefault()
  const newId = genSessionId()
  await sessionState.saveSession(newId)
  window.location.hash = `#${newId}`
}
async function onDelete(event) {
  event.preventDefault()
  if (!event.shiftKey && !confirm('Delete session?')) { return }
  await sessionState.deleteSession()
  openEmptySession()
}

let loadedPlugins = $state(window.eimiPlugins || [])
function updateLoadedPlugins() {
  loadedPlugins = window.eimiPlugins || []
}
onMount(() => { window.updateLoadedPlugins = updateLoadedPlugins })
onDestroy(() => { window.updateLoadedPlugins = null })

async function moveMessage(messageId, direction) {
  const movedId = await sessionState.moveMessage(messageId, direction)
  if (!movedId) return
  await tick()
  document.getElementById(`m_${movedId}`)
    ?.querySelector('.message-content')
    ?.focus({focusVisible: true})
}

function createMessage(values, index = 0) {
  return sessionState.createMessage(values, index)
}
</script>

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
        <Collapsible class="details-style">
          {#snippet summary()}Thinking{/snippet}
          <CustomInput
            generating={c.generating}
            value={c.thinking}
            bind:message={messages[i]}
            attr='thinking'
            style="border: 1px solid var(--text-color);"
          />
        </Collapsible>
      {/if}
      {#if c.markdown}
        <MarkdownRenderer generating={c.generating} content={c.content}/>
      {:else}
        <CustomInput
          generating={c.generating}
          value={c.content}
          bind:message={messages[i]}
          bind:el={messages[i].inputEl}
          onkeyup={() => updateCommandAssist(messages[i])}
          onclick={() => updateCommandAssist(messages[i])}
        />
        <CustomInputPopover target={messages[i].inputEl} show={c.cmdError || c.cmdMatches?.length}>
          {#snippet popover()}
            {#if c.cmdError}
              <div class="meta-gray mono">{c.cmdError}</div>
            {/if}
            {#if c.cmdMatches?.length}
              <div class="meta-gray mono">/{c.cmdMatches.join(' /')}</div>
            {/if}
          {/snippet}
        </CustomInputPopover>
      {/if}
      {#each c.customData as item, index (item)}
        {#if item.renderer === 'image'}
          <Collapsible class="details-style" open={true}>
            {#snippet summary()}
              {item.key}
              <button
                onclick={(e) => {
                  e.preventDefault()
                  c.customData.splice(index, 1)
                }}
                title="Remove field"
              >x</button>
            {/snippet}
            <img class="custom-data-image" src={item.value} alt='' />
          </Collapsible>
        {:else}
          <Collapsible class="details-style">
            {#snippet summary()}
              {item.key}
              <button
                onclick={(e) => {
                  e.preventDefault()
                  c.customData.splice(index, 1)
                }}
                title="Remove field"
              >x</button>
            {/snippet}
            <CustomInput
              generating={c.generating}
              value={item.value}
              bind:message={c.customData[index]}
              attr='value'
              style="border: 1px solid var(--text-color);"
            />
          </Collapsible>
        {/if}
      {/each}
    {/if}
  </div>
{/snippet}

<div class="session-view">
{#if sessionLoaded}
<SessionFaviconChanger {messages} />
<SessionHotkeys {messages} {genResponse} {onCreateMessage} {getMessageFromEvent} {deleteMessage} {moveMessage}/>
<Parameters
  state={windowState}
  {sessionId}
  bind:parameters={sessionData.parameters}
  scripts={sessionScripts.scripts}
/>

<div>
  <input class="title-input" value={sessionData.title} oninput={onTitleUpdate} />
  <button onclick={onDup} title="make a copy of this session">dup</button>
  <button onclick={onDelete} title="delete session (hold shift)">delete</button>
</div>
<div class="meta-gray">
  {new Date(sessionData.createdAt).toLocaleString()}
  | messages: {messageStats.cnt}
  | roots: {messageStats.roots}
  | leafs: {messageStats.leafs}
</div>

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
</div>

<style>
.session-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}
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

.messages {
  max-width: fit-content; /* tmp! */
}

.message {
  position: relative;
  padding-left: calc(var(--depth) * 8px);
}

.message-pad::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: -1px;
  width: calc(var(--depth) * 8px);
  background: repeating-linear-gradient(
    90deg,
    var(--comment-bg-color) 0px 4px,
    transparent 4px 8px
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

:global(.details-style) {
  margin: 0 0.6em 5px 0.6em;
}

.custom-data-image {
  max-width: 100%;
  max-height: 512px;
  width: 100%;
  object-fit: contain;
}
</style>
