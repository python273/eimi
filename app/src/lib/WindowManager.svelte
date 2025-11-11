<script>
import { onMount } from "svelte"
import store from './windowsStore'
import Portal from "./Portal.svelte"
import EmptyWindowContent from './EmptyWindowContent.svelte'

const instances = $state({})
const resizeObservers = {}
const windowZIndices = $state({})

let isDragging = false
let previousX = 0
let previousY = 0
let draggingWindowId = null
let overlay
let windowLastZIndex = 9999

const getElById = (i) => `window-${i}`

function closeWindow(id) {
  if (instances[id] && typeof instances[id].onWindowClose === 'function') {
    try {
      instances[id].onWindowClose()
    } catch (e) {
      console.error(`Error in onWindowClose for window ${id}:`, e)
    }
  }
  
  if (resizeObservers[id]) {
    resizeObservers[id].disconnect()
    delete resizeObservers[id]
  }
  store.update((windows) => windows.filter((w) => w.id !== id))
}

function updateZIndex(id) {
  windowZIndices[id] = windowLastZIndex++
}

$effect(() => {
  $store.forEach(w => {
    if (!windowZIndices[w.id]) updateZIndex(w.id)
  })
})

function handleMouseDown(event, id) {
  if (event.target !== event.currentTarget) return
  isDragging = true
  previousX = event.clientX
  previousY = event.clientY
  draggingWindowId = id

  overlay = document.createElement("div")
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "999999",
    cursor: "move",
  })
  document.body.appendChild(overlay)
}

function handleMouseUp() {
  if (!isDragging) return
  isDragging = false
  previousX = 0
  previousY = 0
  draggingWindowId = null

  if (overlay) {
    overlay.remove()
    overlay = null
  }
}

function handleMouseMove(event) {
  if (!isDragging) return
  event.preventDefault()
  const container = document.getElementById(getElById(draggingWindowId))
  if (!container) return

  const deltaX = event.clientX - previousX
  const deltaY = event.clientY - previousY
  let newLeft = container.offsetLeft + deltaX
  let newTop = container.offsetTop + deltaY

  newTop = Math.max(newTop, 0)

  previousX = event.clientX
  previousY = event.clientY
  store.updateById(draggingWindowId, {left: newLeft, top: newTop})
}

function setupResizeObserver(node, id) {
  if (resizeObservers[id]) {
    resizeObservers[id].disconnect()
  }
  const observer = new ResizeObserver(entries => {
    store.updateById(id, {width: node.offsetWidth, height: node.offsetHeight})
  })
  observer.observe(node)
  resizeObservers[id] = observer
}

onMount(() => {
  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)

  window._createEmptyWindow = (options = {}) => {
    const { onReady, onWindowClose, ...rest } = options
    store.add({
      component: EmptyWindowContent,
      data: { onReady, onWindowClose },
      ...rest
    })
  }

  return () => {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
    Object.values(resizeObservers).forEach(observer => observer.disconnect())
    delete window._createEmptyWindow
  }
})
</script>

<Portal>
  {#each $store as w (w.id)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      id={getElById(w.id)}
      class="window"
      onmousedown={() => updateZIndex(w.id)}
      style="left: {w.left}px; top: {w.top}px; width: {w.width}px; height: {w.height}px; z-index: {windowZIndices[w.id] || 0};"
      use:setupResizeObserver={w.id}
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="window-header" onmousedown={(e) => handleMouseDown(e, w.id)}>
        <button onclick={() => closeWindow(w.id)}>×</button>
        {#each w.buttons as button}
          <button onclick={instances[w.id][button.methodName]}>
            {button.label}
          </button>
        {/each}
        {w.title}
      </div>
      <div class="window-content">
        <w.component
          bind:this={() => instances[w.id], (v) => instances[w.id] = v /* https://github.com/sveltejs/svelte/issues/15698 */}
          windowId={w.id}
          windowWidth={w.width}
          windowHeight={w.height}
          closeWindow={() => closeWindow(w.id)}
          {...w.data}
        />
      </div>
    </div>
  {/each}
</Portal>

<style>
.window {
  position: fixed;
  top: 0px;
  left: 0px;
  background: var(--panel-bg-color);
  display: flex;
  flex-direction: column;
  resize: both;
  overflow: auto;
  border: 1px solid var(--text-color);
  border-radius: 5px;
  box-shadow: 0px 1px 6px #00000047;
}

.window-header {
  background-color: var(--panel-bg-color);
  user-select: none;
  font-size: .85em;
  padding: 2px;
}

.window-content {
  flex: 1;
  overflow: auto;
}
</style>
