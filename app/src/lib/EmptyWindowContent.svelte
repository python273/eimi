<script>
import { onMount, tick } from "svelte"
import windowsStore from "./windowsStore"
let {windowId, onReady} = $props()

let el

function close() {
  windowsStore.close(windowId)
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

