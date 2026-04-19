<script>
import { onDestroy, onMount, untrack } from 'svelte'

let {
  state,
  name,
  title = '',
  mode = 'panel',
  className = '',
  bodyClass = '',
  buttons = [],
  closable = false,
  floatable = false,
  unstyled = false,
  children,
} = $props()

onMount(() => {
  untrack(() => {
    state?.registerWindow({
      id: name,
      name,
      title,
      mode,
      className,
      bodyClass,
      buttons,
      closable,
      floatable,
      unstyled,
      render: children,
    })
  })
})

onDestroy(() => {
  state?.unregisterWindow(name)
})

$effect(() => {
  untrack(() => {
    state?.updateWindow(name, {
      title,
      mode,
      className,
      bodyClass,
      buttons,
      closable,
      floatable,
      unstyled,
    })
  })
})
</script>
