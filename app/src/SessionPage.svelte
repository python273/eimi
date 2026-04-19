<script>
import { onDestroy } from 'svelte'
import Session from './Session.svelte'
import { WindowSystemState } from './lib/WindowSystemState.svelte.js'
import WindowSystem from './lib/WindowSystem.svelte'
import Window from './lib/Window.svelte'

let { sessionId, autoReply, leftInset = '8px' } = $props()
if (!sessionId) { throw new Error('sessionId is required') }

const windowSystem = new WindowSystemState({
  layout: {
    type: 'split',
    direction: 'row',
    children: [
      { node: { type: 'window', id: 'session' }, grow: 1 },
      { node: { type: 'window', id: 'parameters' }, size: 288 },
    ],
  },
})

onDestroy(() => {
  windowSystem.destroy()
})
</script>

<main class="session-page">
  <WindowSystem
    state={windowSystem}
    fixedBounds={{ top: '32px', right: '12px', bottom: '8px', left: leftInset }}
  />

  <Window state={windowSystem} name="session" title="Session" mode="page" unstyled={true}>
    {#key sessionId}
      <Session {sessionId} {autoReply} state={windowSystem} />
    {/key}
  </Window>

  <div class="session-page-spacer"></div>
</main>

<style>
.session-page {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.session-page-spacer {
  height: max(90vh);
}
</style>
