<script>
import { db } from './db.js'
import DEFAULT_CONFIG from "./default_config.json"
import { refreshConfig } from './config.svelte.js'

let config = $state(localStorage["cfg-config-user"] || "")
let valid = $derived.by(() => {
  try {
    JSON.parse(config)
    return true
  } catch {
    return false
  }
})
$effect(() => {
  if (valid) {
    localStorage["cfg-config-user"] = config
    refreshConfig()
  }
})

let importFileInput = $state()

async function exportSessionsToFile() {
  const tx = (await db).transaction(['sessions', 'scripts'], 'readonly')
  
  const data = {
    sessions: {},
    scripts: await tx.objectStore('scripts').getAll()
  }
  
  const sessionKeys = await tx.objectStore('sessions').getAllKeys()
  for (const key of sessionKeys) {
    data.sessions[key] = await tx.objectStore('sessions').get(key)
  }
  
  await tx.done
  const json = JSON.stringify(data)
  const blob = new Blob([json], {type: "application/json"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eimi-llm-ui-sessions-${location.hostname}.json`
  document.body.appendChild(a)
  a.click()
  setTimeout(function() {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}
function importSessionsFromFile(e) {
  e.preventDefault()
  const file = importFileInput.files[0]
  if (!file) {
    alert("No file selected")
    return
  }
  const reader = new FileReader()
  reader.onload = async function(e) {
    let data = JSON.parse(e.target.result)
    data = 'sessions' in data ? data : {sessions: data}
    const tx = (await db).transaction(['sessions', 'sessionMeta', 'scripts'], 'readwrite')
    await tx.objectStore('sessions').clear()
    await tx.objectStore('sessionMeta').clear()
    await tx.objectStore('scripts').clear()

    for (const [id, session] of Object.entries(data.sessions)) {
      await tx.objectStore('sessions').put(session, id)
      await tx.objectStore('sessionMeta').put({
        id,
        title: session.title,
        createdAt: session.createdAt,
      })
    }

    if (data.scripts) {
      for (const script of data.scripts) {
        await tx.objectStore('scripts').put(script)
      }
    }
    
    await tx.done
    importFileInput.value = ''
    alert("Sessions imported")
  }
  reader.readAsText(file)
}
</script>

<main>
  <div><h1>Settings</h1></div>
  <div>
    <details>
      <summary>Config Base</summary>
      <textarea
        id="config-base"
        value={JSON.stringify(DEFAULT_CONFIG, undefined, 2)} disabled></textarea>
    </details>
  </div>
  <hr/>
  <div>
    <label for="config">Config User</label><br/>
    <textarea
      id="config"
      bind:value={config}
      class:invalid={!valid}
    ></textarea>
  </div>
  <hr/>
  <div>
    <button
      onclick={(e) => {
        e.preventDefault()
        exportSessionsToFile()
      }}
    >Export sessions to a file</button>
  </div>
  <div>
    <label for="import-sessions-file">Import sessions from a file (deletes existing data)</label><br/>
    <input bind:this={importFileInput} id="import-sessions-file" type="file" accept=".json"/>
    <button onclick={importSessionsFromFile}>Import</button>
  </div>
  <hr/>
  <div>
    <a href="https://github.com/python273/eimi">https://github.com/python273/eimi</a>
  </div>
</main>

<style>
main {
  display: flex;
  justify-content: center;
  flex-direction: column;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
h1 {
  margin-bottom: 1em;
}
#config, #config-base {
  font-family: monospace;
  margin: 0;
  width: 100%;
  height: 400px;
}
hr {
  width: 100%;
}
.invalid {
  outline: 4px solid red;
}
</style>
