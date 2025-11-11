<script>
import { tick } from 'svelte'

let {
  items = [],
  overscan = 6,
  row = null,        // snippet: ({ item, index }) => fragment
  getKey = null,
  ...rest
} = $props()

let listEl
let itemHeight = 28
let start = $state(0)
let end = $state(-1)
let topH = $state(0)
let bottomH = $state(0)

async function measure() {
  await tick()
  const el = listEl?.children[0]
  const h = el?.offsetHeight || 0
  if (h) itemHeight = h
  update()
}

function update() {
  if (!listEl) return
  const total = items.length
  const base = 1 // first item is always kept
  if (total <= base) {
    start = 0; end = -1; topH = 0; bottomH = 0
    return
  }

  const extraCount = total - base
  const st = listEl.scrollTop
  const vh = listEl.clientHeight
  const extraTop = Math.max(0, st - itemHeight)

  const visStart = Math.floor(extraTop / itemHeight)
  const visEnd = Math.ceil((extraTop + vh) / itemHeight) - 1

  const s = Math.max(0, visStart - overscan)
  const e = Math.min(extraCount - 1, visEnd + overscan)

  start = s
  end = e
  topH = s * itemHeight
  bottomH = Math.max(0, (extraCount - (e + 1)) * itemHeight)
}

function reset() {
  start = 0; end = -1; topH = 0; bottomH = 0
  queueMicrotask(() => { measure(); update() })
}

$effect(() => { items; reset() })

$effect(() => {
  const onResize = () => update()
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
})
</script>

<div bind:this={listEl} onscroll={update} {...rest}>
  {#if items.length > 0}
    {@render row?.({ item: items[0], index: 0 })}
  {/if}

  {#if items.length > 1}
    <div style={`min-height:${topH}px;`}></div>
    {#each items.slice(1 + start, 1 + end + 1) as item, i (getKey ? getKey(item, 1 + start + i) : 1 + start + i)}
      {@render row?.({ item, index: 1 + start + i })}
    {/each}
    <div style={`min-height:${bottomH}px;`}></div>
  {/if}
</div>