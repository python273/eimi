<script>
import { db } from "./db"
import { AsyncFunction, subDbScripts } from "./utils"

let {sessionId, scripts = $bindable(), scriptInstances = $bindable(), scriptsEnabled, apiGenResponse} = $props()

let eimiApi = {
  genResponse: ({messageId}) => apiGenResponse(messageId),
  getSessionId: () => sessionId,
  createEmptyWindow: (options = {}) => window._createEmptyWindow(options),  // Read WindowManager.svelte
}

let loadScriptsPromise = null
let loadScriptsQueued = false
async function loadScripts() {
  if (loadScriptsPromise) {
    loadScriptsQueued = true
    return
  }

  const doLoad = async () => {
    const newScripts = (await (await db).getAll('scripts'))
      .filter(i => (!i.sessionId || i.sessionId === sessionId))
      .sort((a, b) => (a.name.localeCompare(b.name)))

    const classRegex = /^class EimiScript/m
    const oldScriptsById = Object.fromEntries(scripts.map(s => [s.id, s]))

    const enabledSet = new Set(scriptsEnabled || [])
    const compiledClasses = new Map()
    for (const script of newScripts) {
      if (!enabledSet.has(script.id)) continue

      let scriptCode = script.scriptChainProcess
      if (!classRegex.test(scriptCode)) {
        scriptCode = `class EimiScriptLegacy {
  async onRequest(request, newMessage, messages) {
    ${scriptCode}
  }
}
return EimiScriptLegacy;`
      }

      try {
        compiledClasses.set(script.id, {
          script,
          scriptClass: await (new AsyncFunction(scriptCode))()
        })
      } catch (e) {
        console.error(`Error compiling script ${script.name}`, e)
        alert(`Error compiling script ${script.name}:\n${e}`)
      }
    }

    const newInstances = {}
    for (const [scriptId, {script, scriptClass}] of compiledClasses.entries()) {
      const oldScript = oldScriptsById[scriptId]
      const oldInstance = scriptInstances[scriptId]

      if (oldScript?.scriptChainProcess === script.scriptChainProcess && oldInstance) {
        newInstances[scriptId] = oldInstance
      } else {
        if (oldInstance?.onDestroy) {
          try {
            await oldInstance.onDestroy()
          } catch (e) {
            console.error(`Error in onDestroy for script ${oldScript?.name || script.name}:`, e)
            alert(`Error in onDestroy for script ${oldScript?.name || script.name}:\n${e}`)
          }
        }
        try {
          newInstances[scriptId] = new scriptClass({eimiApi})
        } catch (e) {
          console.error(`Error instantiating script ${script.name}`, e)
          alert(`Error instantiating script ${script.name}:\n${e}`)
        }
      }
    }

    for (const scriptId in scriptInstances) {
      if (newInstances[scriptId]) continue
      const instance = scriptInstances[scriptId]
      if (instance?.onDestroy) {
        try {
          await instance.onDestroy()
        } catch (e) {
          const oldScript = oldScriptsById[scriptId]
          console.error(`Error in onDestroy for script ${oldScript?.name || scriptId}:`, e)
          alert(`Error in onDestroy for script ${oldScript?.name || scriptId}:\n${e}`)
        }
      }
    }

    scriptInstances = newInstances
    scripts = newScripts
  }

  loadScriptsPromise = doLoad()
  try {
    await loadScriptsPromise
  } finally {
    loadScriptsPromise = null
    if (loadScriptsQueued) {
      loadScriptsQueued = false
      loadScripts()
    }
  }
}

$effect(() => {
  $subDbScripts
  scriptsEnabled
  loadScripts()
})
</script>
