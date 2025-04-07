<script>
import { onDestroy, onMount } from 'svelte'
import favGenerating from './assets/favicon-generating.png'

const {messages} = $props()

let faviconEl = document.querySelector('link[rel="icon"]')
let isTabVisible = $state(!document.hidden)

onMount(() => {
  const handleVisibilityChange = () => {
    isTabVisible = !document.hidden
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})

$effect(() => {
  isTabVisible
  for (let i of messages) {
    i.generating
  }
  const isGenerating = messages.some(m => m.generating) && !isTabVisible
  faviconEl.href = isGenerating ? favGenerating : '/favicon.png'
})

onDestroy(() => {
  faviconEl.href = '/favicon.png'
})
</script>
