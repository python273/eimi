<script>
import { db } from './db.js'
import DEFAULT_CONFIG from "./default_config.json"
import { refreshConfig } from './config.svelte.js'
import { notifyThemeChange } from './utils.js'
import Collapsible from './lib/Collapsible.svelte'

$effect(() => {
  document.title = `Settings - Eimi LLM UI`
})

let config = $state(localStorage["cfg-config-user"] || "")
let valid = $derived.by(() => {
  console.log('re-derive valid')
  try {
    JSON.parse(config)
    return true
  } catch {
    return false
  }
})

let lightTheme = $state(localStorage.getItem('cfg-theme-light') || 'light')
let darkTheme = $state(localStorage.getItem('cfg-theme-dark') || 'dark')

$effect(() => {
  localStorage.setItem('cfg-theme-light', lightTheme)
  notifyThemeChange()
})

$effect(() => {
  localStorage.setItem('cfg-theme-dark', darkTheme)
  notifyThemeChange()
})
$effect(() => {
  config
  if (valid) {
    localStorage["cfg-config-user"] = $state.snapshot(config)
    console.log('valid update')
    setTimeout(() => { refreshConfig() }, 1)  // TODO: hmm?
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
  const jsonBlob = new Blob([json], {type: "application/json"})
  
  const compressedStream = jsonBlob.stream().pipeThrough(new CompressionStream("gzip"))
  const compressedBlob = await new Response(compressedStream).blob()
  
  const url = URL.createObjectURL(compressedBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eimi-llm-ui-sessions-${location.hostname}.json.gz`
  document.body.appendChild(a)
  a.click()
  setTimeout(function() {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}

async function importSessionsFromFile(e) {
  e.preventDefault()
  const file = importFileInput.files[0]
  if (!file) {
    alert("No file selected")
    return
  }
  
  if (file.name.endsWith('.gz')) {
    const ds = new DecompressionStream("gzip")
    const decompressedStream = file.stream().pipeThrough(ds)
    const decompressedBlob = await new Response(decompressedStream).blob()
    const text = await decompressedBlob.text()
    const data = JSON.parse(text)
    await processImportData(data)
  } else {
    const reader = new FileReader()
    reader.onload = async function(e) {
      const result = e.target.result
      const text = typeof result === 'string' ? result : new TextDecoder().decode(result)
      const data = JSON.parse(text)
      await processImportData(data)
    }
    reader.readAsText(file)
  }
}

async function processImportData(data) {
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
</script>

<main>
  <div><h1>Settings</h1></div>
  <div>
    <Collapsible>
      {#snippet summary()}Config Base{/snippet}
      <textarea
        id="config-base"
        value={JSON.stringify(DEFAULT_CONFIG, undefined, 2)} disabled></textarea>
    </Collapsible>
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
    <h2>Theme</h2>
    <div>
      <label for="light-theme">Light Mode Theme:</label>
      <select id="light-theme" bind:value={lightTheme}>
        <option value="light">Light</option>
        <option value="lavender">Lavender</option>
      </select>
    </div>
    <div>
      <label for="dark-theme">Dark Mode Theme:</label>
      <select id="dark-theme" bind:value={darkTheme}>
        <option value="dark">Dark</option>
        <option value="smolder">Smolder</option>
      </select>
    </div>
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
    <input bind:this={importFileInput} id="import-sessions-file" type="file" accept=".json,.json.gz"/>
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
