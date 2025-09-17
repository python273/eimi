<script>
import { onMount, tick } from "svelte"
let {onReady, onWindowClose: onWindowCloseProp, ...rest} = $props()

let el

export function onWindowClose() {
  if (onWindowCloseProp) {
    onWindowCloseProp()
  }
}

onMount(async () => {
  await tick()
  if (onReady) {
    onReady({el, ...rest})
  }
})
</script>

<div
  bind:this={el}
  style="width: 100%; height: 100%; position: relative;"
></div>

