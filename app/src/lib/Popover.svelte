<script>
import Portal from './Portal.svelte'

let { target = null, show = false, placement = 'bottom-end', offset = 4, className = '', onclose = null, children } = $props()

let panel = $state(null)
let style = $state('position: absolute; left: 0; top: 0; visibility: hidden; z-index: 1000;')

function close() {
  onclose?.()
}

function updatePosition() {
  if (!target || !panel) return
  const rect = target.getBoundingClientRect()
  const left = placement.endsWith('end') ? rect.right - panel.offsetWidth : rect.left
  const top = placement.startsWith('top') ? rect.top - panel.offsetHeight - offset : rect.bottom + offset
  style = `position: absolute; left: ${Math.round(left + window.scrollX)}px; top: ${Math.round(top + window.scrollY)}px; visibility: visible; z-index: 1000;`
}

$effect(() => {
  show
  target
  panel
  if (!show || !target || !panel) {
    style = 'position: absolute; left: 0; top: 0; visibility: hidden; z-index: 1000;'
    return
  }
  updatePosition()
  const onUpdate = () => requestAnimationFrame(updatePosition)
  const onDocClick = (event) => {
    if (target.contains(event.target) || panel.contains(event.target)) return
    close()
  }
  const onKeyDown = (event) => {
    if (event.key === 'Escape') close()
  }
  onUpdate()
  window.addEventListener('scroll', onUpdate, true)
  window.addEventListener('resize', onUpdate)
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('keydown', onKeyDown)
  return () => {
    window.removeEventListener('scroll', onUpdate, true)
    window.removeEventListener('resize', onUpdate)
    document.removeEventListener('click', onDocClick, true)
    document.removeEventListener('keydown', onKeyDown)
  }
})
</script>

{#if show && target}
  <Portal>
    <div bind:this={panel} class={`popover ${className}`.trim()} style={style}>
      {@render children?.()}
    </div>
  </Portal>
{/if}

<style>
.popover {
  min-width: 10rem;
  border: 1px solid var(--text-color);
  background: var(--panel-bg-color);
  box-shadow: 0 1px 6px #00000047;
}
</style>
