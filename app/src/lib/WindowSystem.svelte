<script>
import { onMount } from 'svelte'
import Popover from './Popover.svelte'

let { state: windowState, fixedBounds = {}, flowInsets = {} } = $props()

let hostEl = $state(null)
let rootEl = $state(null)
let hostDocRect = $state({ left: 0, top: 0 })
let frameRect = $state({ left: 0, top: 0, width: 0, height: 0 })
let dragState = $state(null)
let splitResizeState = $state(null)
let dockHighlightId = $state(null)
let menuWindowId = $state('')
let menuTarget = $state(null)
let measureFrame = 0

const boundsStyle = $derived.by(() => {
  const top = fixedBounds.top ?? '0px'
  const right = fixedBounds.right ?? '0px'
  const bottom = fixedBounds.bottom ?? '0px'
  const left = fixedBounds.left ?? '0px'
  return `top:${top};right:${right};bottom:${bottom};left:${left};`
})

function toInsetNumber(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function measureLayout() {
  if (hostEl) {
    const rect = hostEl.getBoundingClientRect()
    const nextHostRect = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    }
    if (nextHostRect.left !== hostDocRect.left || nextHostRect.top !== hostDocRect.top) {
      hostDocRect = nextHostRect
    }
  }
  if (rootEl) {
    const rect = rootEl.getBoundingClientRect()
    const nextFrameRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
    if (
      nextFrameRect.left !== frameRect.left ||
      nextFrameRect.top !== frameRect.top ||
      nextFrameRect.width !== frameRect.width ||
      nextFrameRect.height !== frameRect.height
    ) {
      frameRect = nextFrameRect
    }
  }
}

function scheduleMeasure() {
  cancelAnimationFrame(measureFrame)
  measureFrame = requestAnimationFrame(() => {
    measureFrame = 0
    measureLayout()
  })
}

onMount(() => {
  const previous = window._windowSystem
  window._windowSystem = windowState
  scheduleMeasure()

  const observer = new ResizeObserver(() => scheduleMeasure())
  if (hostEl) observer.observe(hostEl)
  if (rootEl) observer.observe(rootEl)

  const onResize = () => scheduleMeasure()
  window.addEventListener('resize', onResize)

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(measureFrame)
    if (window._windowSystem === windowState) {
      window._windowSystem = previous
    }
  }
})

let renderState = $derived.by(() => {
  windowState?.version
  return windowState?.getRenderState(frameRect) || { page: null, tiled: [], empty: [], floating: [], splitHandles: [] }
})

$effect(() => {
  windowState?.setMeasurements({ frame: frameRect, renderState })
})

$effect(() => {
  boundsStyle
  renderState.page?.rect.left
  renderState.page?.rect.top
  renderState.page?.rect.width
  renderState.page?.rect.height
  scheduleMeasure()
})

const pageStyle = $derived.by(() => {
  const page = renderState.page
  if (!page) return 'display:none;'

  const extraTop = toInsetNumber(flowInsets.top)
  const extraRight = toInsetNumber(flowInsets.right)
  const extraBottom = toInsetNumber(flowInsets.bottom)
  const extraLeft = toInsetNumber(flowInsets.left)

  const marginLeft = Math.max(0, frameRect.left + page.rect.left - hostDocRect.left + extraLeft)
  const marginTop = Math.max(0, frameRect.top + page.rect.top - hostDocRect.top + extraTop)
  const width = Math.max(0, page.rect.width - extraLeft - extraRight)
  const minHeight = Math.max(0, page.rect.height - extraTop - extraBottom)

  return `margin-left:${marginLeft}px;margin-top:${marginTop}px;width:${width}px;min-height:${minHeight}px;`
})

function panelStyle(rect, entry) {
  const left = rect.left
  const top = rect.top
  const width = Math.max(0, rect.width)
  const height = Math.max(0, rect.height)
  const zIndex = entry?.floating ? (entry.zIndex ?? 20) : 2
  return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;z-index:${zIndex};`
}

function emptyStyle(rect, active) {
  return `left:${rect.left}px;top:${rect.top}px;width:${Math.max(0, rect.width)}px;height:${Math.max(0, rect.height)}px;${active ? 'opacity:1;' : ''}`
}

function onTitlePointerDown(event, entry) {
  if (!entry?.floating || event.button !== 0) return
  if (event.target.closest('button')) return

  event.preventDefault()
  windowState.focusWindow(entry.id)
  dragState = {
    id: entry.id,
    startX: event.clientX,
    startY: event.clientY,
    left: entry.left,
    top: entry.top,
  }
}

function updateDockHighlight(clientX, clientY) {
  dockHighlightId = ''
  for (const slot of renderState.empty) {
    const left = frameRect.left + slot.rect.left
    const top = frameRect.top + slot.rect.top
    const right = left + slot.rect.width
    const bottom = top + slot.rect.height
    if (clientX >= left && clientX <= right && clientY >= top && clientY <= bottom) {
      dockHighlightId = slot.id
      break
    }
  }
}

function stopDragging() {
  if (!dragState) return
  const draggingId = dragState.id
  const dockId = dockHighlightId
  dragState = null
  dockHighlightId = ''
  if (dockId) {
    windowState.dockWindow(draggingId, dockId)
  }
}

function splitHandleStyle(handle) {
  return `left:${handle.rect.left}px;top:${handle.rect.top}px;width:${Math.max(0, handle.rect.width)}px;height:${Math.max(0, handle.rect.height)}px;`
}

function onSplitHandlePointerDown(event, handle) {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  splitResizeState = {
    handle,
    startX: event.clientX,
    startY: event.clientY,
  }
}

function stopSplitResize() {
  splitResizeState = null
}

function stopInteractions() {
  stopDragging()
  stopSplitResize()
}

$effect(() => {
  if (!dragState) return

  const currentDrag = dragState

  const onMove = (event) => {
    if (!currentDrag) return
    const left = currentDrag.left + (event.clientX - currentDrag.startX)
    const top = Math.max(0, currentDrag.top + (event.clientY - currentDrag.startY))
    windowState.updateWindow(currentDrag.id, { left, top })
    updateDockHighlight(event.clientX, event.clientY)
  }
  const onUp = () => stopDragging()

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
})

$effect(() => {
  if (!splitResizeState) return

  const currentResize = splitResizeState
  const onMove = (event) => {
    if (!currentResize) return
    const delta = currentResize.handle.direction === 'row'
      ? event.clientX - currentResize.startX
      : event.clientY - currentResize.startY
    windowState.resizeSplit(currentResize.handle, delta)
  }
  const onUp = () => stopSplitResize()

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  return () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
})

function resizeAction(node, entry) {
  if (!entry?.floating) return
  const observer = new ResizeObserver(() => {
    const width = Math.round(node.offsetWidth)
    const height = Math.round(node.offsetHeight)
    if (width !== entry.width || height !== entry.height) {
      windowState.updateWindow(entry.id, { width, height })
    }
  })
  observer.observe(node)
  return {
    destroy() {
      observer.disconnect()
    },
  }
}

function attachMount(node, entry) {
  const attach = (nextEntry) => {
    if (!nextEntry?.mountEl) return
    if (nextEntry.mountEl.parentNode !== node) {
      node.replaceChildren()
      node.appendChild(nextEntry.mountEl)
    }
    windowState.markWindowReady(nextEntry.id)
  }

  attach(entry)

  return {
    update(nextEntry) {
      attach(nextEntry)
    },
  }
}

function openMenu(entry, target) {
  if (menuWindowId === entry.id) {
    menuWindowId = ''
    menuTarget = null
    return
  }
  menuWindowId = entry.id
  menuTarget = target
}

function closeMenu() {
  menuWindowId = ''
  menuTarget = null
}

function createSlot(entry, side) {
  windowState.createDockTarget(entry.id, side)
  closeMenu()
}

function undock(entry) {
  windowState.floatWindow(entry.id)
  closeMenu()
}

function renderButton(entry, button) {
  return (event) => windowState.callButton(entry.id, button, event)
}

function closeSlot(event, slotId) {
  event.preventDefault()
  event.stopPropagation()
  windowState.closeSlot(slotId)
}
</script>

{#snippet windowChrome({ entry, rect, showMenu = false, draggable = false, pageBody = false })}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class={`window-titlebar ${draggable ? 'draggable' : ''}`.trim()}
    onpointerdown={draggable ? (event) => onTitlePointerDown(event, entry) : undefined}
  >
    <div class="window-title">{entry.title}</div>
    <div class="window-title-actions">
      {#each entry.buttons || [] as button}
        <button type="button" onclick={renderButton(entry, button)}>{button.label}</button>
      {/each}
      {#if showMenu}
        <button type="button" class="menu-button" onclick={(event) => openMenu(entry, event.currentTarget)}>⋯</button>
      {/if}
      {#if entry.closable}
        <button type="button" onclick={() => windowState.closeWindow(entry.id)}>×</button>
      {/if}
    </div>
  </div>
  <div class={`window-body ${pageBody ? 'page-body ' : ''}${entry.bodyClass || ''}`.trim()}>
    {#if entry.mountEl}
      <div class={`window-body-inner ${entry.bodyClass || ''}`.trim()} use:attachMount={entry}></div>
    {:else if entry.component}
      <entry.component
        bind:this={() => windowState.componentInstances[entry.id], (value) => windowState.setComponentInstance(entry.id, value)}
        windowId={entry.id}
        windowWidth={Math.round(rect.width)}
        windowHeight={Math.round(rect.height)}
        closeWindow={() => windowState.closeWindow(entry.id)}
        {...entry.data}
      />
    {:else}
      {@render entry.render?.()}
    {/if}
  </div>
{/snippet}

<div class="window-system-host" bind:this={hostEl}>
  {#if renderState.page}
    <section class={`page-window ${renderState.page.entry.className || ''}`.trim()} style={pageStyle}>
      <div class={`window-frame page-frame ${renderState.page.entry.unstyled ? 'unstyled-frame' : ''}`.trim()}>
        {@render windowChrome({ entry: renderState.page.entry, rect: renderState.page.rect, showMenu: true, pageBody: true })}
      </div>
    </section>
  {/if}

  <div bind:this={rootEl} class="window-system-root" style={boundsStyle}>
    {#each renderState.splitHandles as handle (handle.id)}
      <div
        class={`split-handle split-handle-${handle.direction}`}
        style={splitHandleStyle(handle)}
        onpointerdown={(event) => onSplitHandlePointerDown(event, handle)}
      ></div>
    {/each}

    {#each renderState.empty as slot (slot.id)}
      <div class:active-dock-target={dockHighlightId === slot.id} class="empty-slot" style={emptyStyle(slot.rect, dockHighlightId === slot.id)}>
        <button type="button" class="empty-slot-close" onclick={(event) => closeSlot(event, slot.id)}>×</button>
        <div>Empty slot</div>
      </div>
    {/each}

    {#each renderState.tiled as item (item.entry.id)}
      <section class={`window-frame tiled-frame ${item.entry.unstyled ? 'unstyled-frame ' : ''}${item.entry.className || ''}`.trim()} style={panelStyle(item.rect, item.entry)}>
        {@render windowChrome({ entry: item.entry, rect: item.rect, showMenu: true })}
      </section>
    {/each}

    {#each renderState.floating as entry (entry.id)}
      <section
        class={`window-frame floating-frame ${entry.unstyled ? 'unstyled-frame ' : ''}${entry.className || ''}`.trim()}
        style={panelStyle({ left: entry.left, top: entry.top, width: entry.width, height: entry.height }, entry)}
        use:resizeAction={entry}
        onpointerdown={() => windowState.focusWindow(entry.id)}
      >
        {@render windowChrome({ entry, rect: { width: entry.width, height: entry.height }, draggable: true })}
      </section>
    {/each}

    {#if dragState || splitResizeState}
      <div
        class={`drag-overlay ${splitResizeState ? `drag-overlay-${splitResizeState.handle.direction}` : ''}`.trim()}
        onpointerup={stopInteractions}
      ></div>
    {/if}
  </div>

  {#if menuWindowId}
    <Popover target={menuTarget} show={true} onclose={closeMenu} className="window-menu">
      <div class="window-menu-items">
        <button type="button" onclick={() => createSlot(windowState.windows[menuWindowId], 'left')}>Split left</button>
        <button type="button" onclick={() => createSlot(windowState.windows[menuWindowId], 'right')}>Split right</button>
        <button type="button" onclick={() => createSlot(windowState.windows[menuWindowId], 'top')}>Split top</button>
        <button type="button" onclick={() => createSlot(windowState.windows[menuWindowId], 'bottom')}>Split bottom</button>
        {#if windowState.windows[menuWindowId]?.floatable}
          <button type="button" onclick={() => undock(windowState.windows[menuWindowId])}>Undock</button>
        {/if}
      </div>
    </Popover>
  {/if}
</div>

<style>
.window-system-host {
  width: 100%;
}

.window-system-root {
  position: fixed;
  pointer-events: none;
  z-index: 10;
}

.page-window {
  box-sizing: border-box;
}

.window-frame {
  border-radius: 4px;
  background: var(--panel-bg-color);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.unstyled-frame {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.page-frame {
  min-height: inherit;
}

.tiled-frame,
.floating-frame,
.empty-slot,
.split-handle {
  position: absolute;
  pointer-events: auto;
}

.split-handle {
  z-index: 4;
  background: transparent;
}

.split-handle::before {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
}

.split-handle-row {
  cursor: col-resize;
}

.split-handle-column {
  cursor: row-resize;
}

.floating-frame {
  border: 1px solid var(--text-color);
  resize: both;
  overflow: hidden;
  box-shadow: 0 1px 6px #00000047;
}

.window-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 1.5em;
  padding: 0 6px;
  border-bottom: 1px solid #0000001f;
  user-select: none;
}

.window-title {
  font-size: 0.9em;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-title-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.page-body {
  overflow: visible;
}

.window-body-inner {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.empty-slot {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed color-mix(in srgb, var(--text-color) 55%, transparent);
  background: color-mix(in srgb, var(--panel-bg-color) 65%, transparent);
  color: color-mix(in srgb, var(--text-color) 65%, transparent);
  border-radius: 4px;
  font-size: 0.8em;
  opacity: 0.8;
}

.empty-slot-close {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 1.6rem;
  min-height: 1.6rem;
  padding: 0;
  border-radius: 999px;
}

.empty-slot.active-dock-target {
  border-style: solid;
  border-color: var(--brand-color);
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--brand-color) 40%, transparent);
  color: var(--text-color);
  opacity: 1;
}

.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  cursor: move;
  pointer-events: auto;
}

.drag-overlay-row {
  cursor: col-resize;
}

.drag-overlay-column {
  cursor: row-resize;
}

.draggable {
  cursor: move;
}

.menu-button {
  min-width: 1.6rem;
}

.window-menu-items {
  display: flex;
  flex-direction: column;
}

.window-menu-items button {
  text-align: left;
}
</style>
