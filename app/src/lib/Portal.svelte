<script>
import { onMount, onDestroy } from 'svelte'
let { children } = $props()
let ref = $state()
let portal

onMount(() => {
  portal = document.createElement('div')
  portal.className = 'portal'
  document.body.appendChild(portal)
  portal.appendChild(ref)
})

onDestroy(() => {
  document.body.removeChild(portal)
})
</script>

<div class="portal-clone" style="display: none;">
  <div bind:this={ref}>
    {@render children?.()}
  </div>
</div>
