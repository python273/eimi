<script>
import { onMount, onDestroy, tick } from 'svelte'

let {messages, genResponse, onCreateMessage, getMessageFromEvent, deleteMessage, moveMessage} = $props()

function isPressed(e, combo) {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop()
  
  let code
  switch (key) {
  case '?': code = 'Slash'; break
  case 'esc':
  case 'escape': code = 'Escape'; break
  case 'enter': code = 'Enter'; break
  default: code = key.length === 1 ? `Key${key.toUpperCase()}` : key
  }
  
  const wants = {
    shift: parts.includes('shift'),
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta'),
  }
  
  return e.code === code &&
    e.shiftKey === wants.shift &&
    e.ctrlKey === wants.ctrl &&
    e.altKey === wants.alt &&
    e.metaKey === wants.meta
}

const HELP_DISMISSED_KEY = 'cfg-hotkeys-shown'
let show = $state(false)
let showHelpTip = $state(localStorage.getItem(HELP_DISMISSED_KEY) !== '1')

function toggleHelpDialog() {
  show = !show
  showHelpTip = false
  localStorage.setItem(HELP_DISMISSED_KEY, '1')
}

async function onKeyDown(e) {
  const hot = (combo) => isPressed(e, combo)

  if (hot('shift+?') && !e.target.matches('input, textarea')) {
    e.preventDefault()
    toggleHelpDialog()
    return
  }

  // Hotkeys:
  // Ctrl+Enter - gen response
  // (textarea)+Esc - focus on message
  // A - focus on textarea
  // j - down
  // k - up
  // p - jump to parent
  // R - regen
  // x / X - delete
  // Ctrl+k - move the message up
  // Ctrl+j - move the message down
  // n - new message (reply)
  // q - abort message generation

  if (!e.target.closest('.message-content')) return

  if (e.target.tagName === 'TEXTAREA' && hot('escape')) {
    e.preventDefault()
    e.target.closest('.message-content')?.focus({focusVisible: true})
    return
  } else if (hot('ctrl+enter') || hot('meta+enter')) {
    e.preventDefault()
    return genResponse(e)
  }

  if (!e.target.classList.contains('message-content')) return
  const item = getMessageFromEvent(e)
  if (!item) return

  if (hot('n')) {
    e.preventDefault()
    return onCreateMessage(e)
  } else if (hot('q')) {
    e.preventDefault()
    item.aborter?.abort()
    return
  } else if (hot('shift+r')) {
    e.preventDefault()
    return genResponse(e, true)
  } else if (hot('x') || hot('shift+x')) {
    e.preventDefault()
    let i = messages.findIndex(i => i.id == item.id) - 1
    deleteMessage(e)
    if (i < 0) return
    document.getElementById(`m_${messages[i].id}`)
      ?.querySelector('.message-content')
      ?.focus({focusVisible: true})
  } else if (hot('ctrl+k') || hot('meta+k')) {
    e.preventDefault()
    moveMessage(item.id, 'up')
  } else if (hot('ctrl+j') || hot('meta+j')) {
    e.preventDefault()
    moveMessage(item.id, 'down')
  } else if (hot('j') || hot('k') || hot('p')) {
    e.preventDefault()
    let i
    if (e.code === 'KeyP') {
      i = messages.findIndex(i => i.id == item.parentId)
    } else {
      i = messages.findIndex(i => i.id == item.id) + (e.code === 'KeyJ' ? 1 : -1)
    }
    if (i < 0 || i >= messages.length) return
    const el = document.getElementById(`m_${messages[i].id}`)
      ?.querySelector('.message-content')
    if (!el) return

    const rect = el.getBoundingClientRect()
    const isPartiallyOffscreen = rect.top < 0 || rect.bottom > window.innerHeight
    if (isPartiallyOffscreen) el.scrollIntoView(true)
    el.focus({preventScroll: true, focusVisible: true})
  } else if (hot('shift+a')) {
    e.preventDefault()
    item.markdown = false
    await tick()
    const textarea = e.target.querySelector('textarea')
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
      setTimeout(() => {
        const rect = textarea.getBoundingClientRect()
        const isBottomInView = (
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        )
        if (!isBottomInView) {
          textarea.scrollIntoView({ behavior: 'instant', block: 'end' })
        }
      }, 0)
    }
  }
}

onMount(() => {
  document.addEventListener('keydown', onKeyDown)
})
onDestroy(() => {
  document.removeEventListener('keydown', onKeyDown)
})

let dialogElement = $state()
$effect(() => {
  if (show && dialogElement) {
    dialogElement.showModal()
  } else if (dialogElement) {
    dialogElement.close()
  }
})
</script>

{#if showHelpTip}
  <div class="help-tip">
    Press <span class="key">Shift + ?</span> for keyboard shortcuts
  </div>
{/if}

{#if show}
  <dialog bind:this={dialogElement} onclose={() => show = false}>
    <button class="close-btn" onclick={() => show = false} type="button">×</button>
    <h2>Keyboard Shortcuts</h2>
    <hr/>
    
    <div class="shortcuts-section">
      <h3>Global</h3>
      <div><span class="key">?</span> Show/hide this help dialog</div>
    </div>

    <div class="shortcuts-section">
      <h3>Message Textarea</h3>
      <div><span class="key">Ctrl + Enter</span> Generate response</div>
      <div><span class="key">Esc</span> Exit text area to use other hotkeys</div>
    </div>

    <div class="shortcuts-section">
      <h3>Message Actions (when a message is focused)</h3>
      <div><span class="key">Shift + A</span> Focus on text area</div>
      <div><span class="key">n</span> Create empty reply</div>
      <div><span class="key">j</span> Move to next message</div>
      <div><span class="key">k</span> Move to previous message</div>
      <div><span class="key">p</span> Jump to parent message</div>
      <div><span class="key">Shift + R</span> Regenerate current message</div>
      <div><span class="key">x</span> or <span class="key">Shift + X</span> Delete message</div>
      <div><span class="key">Ctrl + k</span> Move the message up</div>
      <div><span class="key">Ctrl + j</span> Move the message down</div>
      <div><span class="key">q</span> Stop generation</div>
    </div>
  </dialog>
{/if}

<style>
.help-tip {
  padding: 0.5em 1em;
}

.close-btn {
  position: absolute;
  right: 1em;
  top: 1em;
}

.shortcuts-section {
  margin-bottom: 1em;
}

.key {
  background-color: var(--code-bg-color);
  font-family: monospace;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.9em;
  font-weight: 600;
}
</style>
