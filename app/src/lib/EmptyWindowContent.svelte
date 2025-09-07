<script>
  import { onMount, tick } from "svelte"
  let {windowId, onReady} = $props()

  let el

  onMount(async () => {
    await tick()
    if (onReady) {
      onReady(windowId, el)
    }
  })
</script>

<div
  bind:this={el}
  style="width: 100%; height: 100%; position: relative;"
></div>

