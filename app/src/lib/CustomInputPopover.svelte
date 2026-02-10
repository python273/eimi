<script>
import { onDestroy } from 'svelte'
import Portal from './Portal.svelte'

let { target, show = false, popover = null } = $props()
let style = $state('')
let mirror

function getCaretRect() {
  if (!target) return
  if (!mirror) {
    mirror = document.createElement('div')
    mirror.style.position = 'absolute'
    mirror.style.top = '-99999px'
    mirror.style.left = '-99999px'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordWrap = 'break-word'
    mirror.style.overflowWrap = 'break-word'
    document.body.appendChild(mirror)
  }

  const cs = getComputedStyle(target)
  mirror.style.font = cs.font
  mirror.style.letterSpacing = cs.letterSpacing
  mirror.style.textTransform = cs.textTransform
  mirror.style.textIndent = cs.textIndent
  mirror.style.padding = cs.padding
  mirror.style.border = cs.border
  mirror.style.boxSizing = cs.boxSizing
  mirror.style.width = cs.width
  mirror.style.lineHeight = cs.lineHeight

  const text = target.value ?? ''
  const pos = target.selectionStart ?? text.length
  mirror.textContent = text.slice(0, pos)
  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  mirror.appendChild(marker)
  mirror.append(text.slice(pos))

  const targetRect = target.getBoundingClientRect()
  const markerRect = marker.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  const left = markerRect.left - mirrorRect.left + targetRect.left - target.scrollLeft
  const top = markerRect.top - mirrorRect.top + targetRect.top - target.scrollTop
  const height = markerRect.height || parseFloat(cs.lineHeight) || 16

  mirror.textContent = ''
  return {left, top, height}
}

function updatePos() {
  if (!target) return
  const r = target.getBoundingClientRect()
  const caret = getCaretRect()
  const left = Math.round((caret?.left ?? r.left) + window.scrollX)
  const top = Math.round((caret?.top ?? r.bottom) + (caret?.height ?? 0) + window.scrollY)
  const width = Math.max(20, Math.round(r.right + window.scrollX - left))
  style = `position:absolute;left:${left}px;top:${top}px;width:${width}px;z-index:1000;background:var(--panel-bg-color);`
}

$effect(() => {
  show
  target
  if (!show || !target) return
  updatePos()
  const onUpdate = () => updatePos()
  const onTargetUpdate = () => updatePos()
  window.addEventListener('scroll', onUpdate, true)
  window.addEventListener('resize', onUpdate)
  target.addEventListener('input', onTargetUpdate)
  target.addEventListener('keyup', onTargetUpdate)
  target.addEventListener('click', onTargetUpdate)
  target.addEventListener('focus', onTargetUpdate)
  target.addEventListener('scroll', onTargetUpdate)
  return () => {
    window.removeEventListener('scroll', onUpdate, true)
    window.removeEventListener('resize', onUpdate)
    target.removeEventListener('input', onTargetUpdate)
    target.removeEventListener('keyup', onTargetUpdate)
    target.removeEventListener('click', onTargetUpdate)
    target.removeEventListener('focus', onTargetUpdate)
    target.removeEventListener('scroll', onTargetUpdate)
  }
})

onDestroy(() => {
  if (mirror) mirror.remove()
})
</script>

{#if show && popover}
  <Portal>
    <div style={style}>
      {@render popover()}
    </div>
  </Portal>
{/if}
