<script>
import { onMount, tick } from "svelte"
let {windowId, closeWindow, onReady, onWindowClose: onWindowCloseProp} = $props()

let el

function close() {
  closeWindow()
}

export function onWindowClose() {
  if (onWindowCloseProp) {
    onWindowCloseProp()
  }
}

onMount(async () => {
  await tick()
  if (onReady) {
    onReady(windowId, el, close)
  }
})
</script>

<div
  bind:this={el}
  style="width: 100%; height: 100%; position: relative;"
></div>

