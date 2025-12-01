<script>
import { onMount } from 'svelte'
import { db } from './db.js'
import { escapeRegExp } from './utils.js'
import Collapsible from './lib/Collapsible.svelte'

let { query } = $props()

let searchQuery = $state(query || '')
let searchResults = $state([])
let searching = $state(false)
let hasSearched = $state(false)

async function searchAllMessages() {
  hasSearched = true
  if (searchQuery.trim() === '') {
    searchResults = []
    return
  }

  searching = true
  try {
    const searchRe = new RegExp(escapeRegExp(searchQuery), 'i')
    const results = []

    const matchingSessions = []
    const sessionsTx = (await db).transaction('sessions', 'readonly')

    for await (const cursor of sessionsTx.store) {
      const session = cursor.value
      const sessionId = cursor.key // Get the key which is the session ID

      const matchingMessages = session.messages.filter(msg => searchRe.test(msg.content))

      if (matchingMessages.length > 0) {
        matchingSessions.push({
          sessionId: sessionId,
          messages: matchingMessages
        })
      }
    }

    // Then fetch metadata for matching sessions
    if (matchingSessions.length > 0) {
      const metaTx = (await db).transaction('sessionMeta', 'readonly')
      const metaStore = metaTx.objectStore('sessionMeta')

      for (const matchingSession of matchingSessions) {
        const sessionMeta = await metaStore.get(matchingSession.sessionId)
        results.push({
          sessionId: matchingSession.sessionId,
          title: sessionMeta.title || 'Untitled Session',
          createdAt: sessionMeta.createdAt,
          messages: matchingSession.messages
        })
      }
    }

    searchResults = results.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error('Search error:', error)
    alert('Search failed: ' + error.message)
  } finally {
    searching = false
  }
}

onMount(() => {
  if (query) searchAllMessages()
})

function updateSearchUrl() {
  if (searchQuery.trim()) {
    const newHash = `#search?query=${encodeURIComponent(searchQuery.trim())}`
    history.replaceState(null, '', newHash)
  } else {
    history.replaceState(null, '', '#search')
  }
}

function handleSearch() {
  updateSearchUrl()
  searchAllMessages()
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

let searchTimeout
$effect(() => {
  searchQuery
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    updateSearchUrl()
  }, 500)
})

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return isNaN(date.getTime()) ? '' : date.toLocaleString()
}

function highlightText(text, query) {
  if (!query || !text) return [{text: '', highlighted: false}]

  const parts = []
  const searchRe = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  let lastIndex = 0
  let match

  while ((match = searchRe.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        highlighted: false
      })
    }

    // Add highlighted match
    parts.push({
      text: match[1],
      highlighted: true
    })

    lastIndex = searchRe.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlighted: false
    })
  }

  return parts.length > 0 ? parts : [{text: text, highlighted: false}]
}
</script>

<main>
<div class="search-container">
  <h1>Search Messages</h1>

  <div class="search-input-container">
    <input
      type="search"
      placeholder="Search all messages across sessions..."
      bind:value={searchQuery}
      class="search-input"
      onkeydown={handleKeydown}
    />
    <button
      class="search-button"
      onclick={handleSearch}
    >
      Search
    </button>
  </div>

  <div class="search-stats">
    {#if hasSearched && searchQuery.trim() !== ''}
      {#if !searching}
        Found {searchResults.reduce((sum, r) => sum + r.messages.length, 0)} messages in {searchResults.length} sessions
      {/if}
    {/if}
  </div>

  <div class="search-results">
    {#each searchResults as result (result.sessionId)}
      <div class="session-result">
        <div class="session-header">
          <a href={`#${result.sessionId}`} class="session-title no-vs">{result.title}</a>
          <div class="session-date">{formatDate(result.createdAt)}</div>
        </div>

        <Collapsible>
          {#snippet summary()}Messages ({result.messages.length} matching){/snippet}
          <div class="messages-list">
            {#each result.messages as message (message.id)}
              <div class="message-result">
                <div class="message-meta">
                  <span class="message-role">{message.role}</span>
                  <span class="message-date">{formatDate(message.createdAt)}</span>
                </div>
                <div class="message-content">
                  {#each highlightText(message.content, searchQuery) as part}
                    {#if part.highlighted}
                      <mark>{part.text}</mark>
                    {:else}
                      {part.text}
                    {/if}
                  {/each}
                </div>
                <hr/>
              </div>
            {/each}
          </div>
        </Collapsible>
      </div>
    {:else}
      {#if hasSearched && searchQuery.trim() !== '' && !searching}
        <div class="no-results">No messages found matching "{searchQuery}"</div>
      {/if}
    {/each}
  </div>
</div>

<div style="height: max(90vh);"></div>
</main>

<style>
main {
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.search-container {
  width: 64ch;
  max-width: 64ch;
  margin: 0 auto;
  padding: 20px;
}

.search-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 1em;
}

.search-input {
  flex: 1;
  padding: 0.5em;
}

.search-stats {
  margin-bottom: 1em;
  font-size: 0.7em;
}

.session-result {
  margin-bottom: 0.5em;
  border: 1px solid var(--comment-bg-color);
  border-radius: 4px;
  background-color: var(--comment-bg-color);
  padding: 0.5em;
}

.session-header {
  display: flex;
  padding-bottom: 0.5em;
}

.session-title {
  flex: 1;
}

.session-date {
  font-size: 0.75em;
}

.messages-list {
  padding: 0;
}

.message-result {
  padding-top: 0.5em;
  border-top: 1px solid var(--comment-bg-color);
}

.message-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.message-role {
  background-color: var(--brand-color);
  color: white;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  font-size: 11px;
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

:global(mark) {
  background-color: yellow;
  color: black;
}

.no-results {
  text-align: center;
  padding: 40px;
  opacity: 0.7;
}
</style>