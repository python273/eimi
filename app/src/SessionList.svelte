<script>
import { db } from './db.js'
import { escapeRegExp, subSessionList } from './utils.js'
import VirtualList from './VirtualList.svelte'

let { sessionId } = $props()

let sessions = $state([])
let searchQuery = $state('')

async function loadSessionsList() {
  const tx = (await db).transaction('sessionMeta', 'readonly')
  const allMeta = await tx.store.getAll()
  allMeta.sort((a, b) => b.id.localeCompare(a.id))
  sessions = allMeta
}

$effect(() => {
  $subSessionList
  loadSessionsList()
})

let filteredSessions = $derived.by(() => {
  if (searchQuery === '') return sessions
  let searchRe = new RegExp(escapeRegExp(searchQuery), 'i')
  return sessions.filter(s => searchRe.test(s.title))
})
</script>

<div class="sessions-panel">
  <input
    type="search"
    placeholder="Search..."
    value={searchQuery}
    oninput={(event) => searchQuery = event.currentTarget.value}
  />

  {#if filteredSessions.length > 0}
    <VirtualList
      class="sessions-list"
      items={filteredSessions}
      overscan={4}
      getKey={(s) => s.id}
    >
      {#snippet row({ item })}
        <a href={`#${item.id}`} class:session-active={item.id === sessionId}>{item.title}</a>
      {/snippet}
    </VirtualList>
  {:else}
    <div class="sessions-list sessions-empty">
      <span>Sessions will be here.</span>
    </div>
  {/if}
</div>

<style>
.sessions-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  font-size: 0.94em;
  padding: 5px 0;
  background-color: var(--panel-bg-color);
  border-radius: 5px;
  margin: 0 0 0 8px;
  box-shadow: 0 1px 6px #00000047;
  margin-right: 4px;
}

.sessions-empty span {
  filter: opacity(30%);
  margin: 10px;
}

:global(.sessions-list) {
  min-height: 0;
  max-width: 100%;
  flex: 1;
  overflow-y: auto;
}

:global(.sessions-list a) {
  min-height: 1.2em;
  padding: 0 5px;
  margin: 0 5px;
  color: var(--text-color);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 2px;
}

:global(.sessions-list a:hover) {
  background: #0000000f;
}

:global(.sessions-list .session-active) {
  color: #fff;
  background: var(--brand-color) !important;
}
</style>
