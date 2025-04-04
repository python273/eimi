<script>
import { onMount, onDestroy } from 'svelte'

export let data
export let genResponse
export let onCreateMessage
export let getMessageFromEvent
export let deleteMessage

let show = false

function toggleHelpDialog() {
  show = !show
}

function onKeyDown(event) {
  if (event.key === '?' && !event.target.matches('input, textarea')) {
    event.preventDefault()
    toggleHelpDialog()
    return
  }

  // Hotkeys:
  // Ctrl+Enter - gen response
  // Shift+Enter - reply
  // (textarea)+Esc - focus on message
  // A - focus on textarea
  // j - down
  // k - up
  // p - jump to parent
  // R - regen
  // x / X - delete

  if (!event.target.closest('.message-content')) return

  if (event.target.tagName === 'TEXTAREA' && event.key === 'Escape') {
    event.preventDefault()
    event.target.closest('.message-content')?.focus({focusVisible: true})
    return
  } else if ((event.metaKey || event.ctrlKey) && event.code === "Enter") {
    event.preventDefault()
    return genResponse(event)
  } else if (event.shiftKey && event.code === "Enter") {
    event.preventDefault()
    return onCreateMessage(event)
  }

  if (!event.target.classList.contains('message-content')) return
  const item = getMessageFromEvent(event)
  if (!item) return

  if (event.key === 'R') {
    event.preventDefault()
    return genResponse(event, true)
  } else if (event.key === 'x' || event.key === 'X') {
    event.preventDefault()
    let i = data.findIndex(i => i.id == item.id) - 1
    deleteMessage(event)
    if (i < 0) return
    document.getElementById(`m_${data[i].id}`)
      ?.querySelector('.message-content')
      ?.focus({focusVisible: true})
  } else if (event.key === 'j' || event.key === 'k' || event.key === 'p') {
    event.preventDefault()
    let i
    if (event.key === 'p') {
      i = data.findIndex(i => i.id == item.parentId)
    } else {
      i = data.findIndex(i => i.id == item.id) + (event.key === 'j' ? 1 : -1)
    }
    if (i < 0 || i >= data.length) return
    const el = document.getElementById(`m_${data[i].id}`)
      ?.querySelector('.message-content')
    if (!el) return

    const rect = el.getBoundingClientRect()
    const isPartiallyOffscreen = rect.top < 0 || rect.bottom > window.innerHeight
    if (isPartiallyOffscreen) el.scrollIntoView(true)
    el.focus({preventScroll: true, focusVisible: true})
  } else if (event.key === 'A') {
    event.preventDefault()
    const textarea = event.target.querySelector('textarea')
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

let dialogElement
$: if (show && dialogElement) {
  dialogElement.showModal()
} else if (dialogElement) {
  dialogElement.close()
}
</script>

{#if show}
  <dialog bind:this={dialogElement} on:close={() => show = false}>
    <button class="close-btn" on:click={() => show = false} type="button">×</button>
    <h2>Keyboard Shortcuts</h2>
    <hr/>
    
    <div class="shortcuts-section">
      <h3>Global</h3>
      <div><span class="key">?</span> Show/hide this help dialog</div>
    </div>

    <div class="shortcuts-section">
      <h3>Message Textarea</h3>
      <div><span class="key">Ctrl + Enter</span> Generate response</div>
      <div><span class="key">Shift + Enter</span> Create empty reply</div>
      <div><span class="key">Esc</span> Exit text area to use other hotkeys</div>
    </div>

    <div class="shortcuts-section">
      <h3>Message Actions</h3>
      <div><span class="key">Shift + A</span> Focus on text area</div>
      <div><span class="key">j</span> Move to next message</div>
      <div><span class="key">k</span> Move to previous message</div>
      <div><span class="key">p</span> Jump to parent message</div>
      <div><span class="key">Shift + R</span> Regenerate response</div>
      <div><span class="key">x</span> or <span class="key">Shift + X</span> Delete message</div>
    </div>
  </dialog>
{/if}

<style>
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
