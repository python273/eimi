import { tick } from "svelte"
import { db } from "./db"
import { AsyncFunction, subDbScripts } from "./utils"

class MessageNotFoundError extends Error {
  constructor(msgid) {
    super(`Message not found: ${msgid}`)
    this.name = "MessageNotFoundError"
    this.msgid = msgid
  }
}

export class SessionScripts {
  scripts = $state([])
  scriptInstances = $state({})
  loadScriptsPromise = null
  loadScriptsQueued = false
  unsubscribeDbScripts = null

  constructor({ sessionId, getMessages, getSessionData, apiGenResponse, createMessage, updateTree }) {
    this.sessionId = sessionId
    this.getMessages = getMessages
    this.getSessionData = getSessionData
    this.apiGenResponse = apiGenResponse
    this.createMessage = createMessage
    this.updateTree = updateTree
    this.eimiApi = {
      _tick: tick,
      _updateTree: updateTree,  // TODO: fix reactivity for parentId?
      genResponse: ({messageId, params}) => apiGenResponse(messageId, params),
      getSessionId: () => sessionId,
      getSessionInfo: () => getSessionData(),
      getSessionMessages: () => getMessages(),
      createEmptyWindow: (options = {}) => window._createEmptyWindow(options),
      createMessage,
      customDataGetAll: (msgid) => {
        const message = this.getMessageOrThrow(msgid)
        return message.customData
      },
      customDataGet: (msgid, key) => {
        const message = this.getMessageOrThrow(msgid)
        return message.customData.find(d => d.key === key)
      },
      customDataSet: (msgid, key, value, options = {}) => {
        const message = this.getMessageOrThrow(msgid)
        let item = message.customData.find(d => d.key === key)
        if (item) {
          item.value = value
          if (options.renderer !== undefined) item.renderer = options.renderer
        } else {
          message.customData.push({key, value, ...options})
          item = message.customData.at(-1)
        }
        return item
      },
      customDataRemove: (msgid, key) => {
        const message = this.getMessageOrThrow(msgid)
        const index = message.customData.findIndex(d => d.key === key)
        if (index === -1) return
        return message.customData.splice(index, 1)[0]
      },
      getSessionScriptInstances: () => this.scriptInstances,
      getSessionScripts: () => this.scripts,
    }
    window._eimiApi = this.eimiApi
    this.unsubscribeDbScripts = subDbScripts.subscribe(() => this.loadScripts())

    this.availableCommands = $derived.by(() => {
      const enabled = new Set(this.getScriptsEnabledList())
      const list = []
      for (const script of this.scripts) {
        if (!enabled.has(script.id)) continue
        const instance = this.scriptInstances[script.id]
        const commands = instance?.constructor?.commands
        if (!Array.isArray(commands)) continue
        for (const cmd of commands) if (cmd?.name) list.push(cmd.name)
      }
      const uniq = Array.from(new Set(list))
      uniq.sort((a, b) => a.localeCompare(b))
      return uniq
    })

    $effect(() => {
      this.getSessionData()?.parameters?.scriptsEnabled?.map(i => i)
      this.loadScripts()
    })
  }

  getScriptsEnabledList = (scriptsEnabled) =>
    scriptsEnabled || this.getSessionData()?.parameters?.scriptsEnabled || []

  getMessageOrThrow = (msgid) => {
    const message = this.getMessages().find(m => m.id === msgid)
    if (!message) throw new MessageNotFoundError(msgid)
    return message
  }

  getOrderedScriptsEnabled = (scriptsEnabled) => {
    const enabled = new Set(this.getScriptsEnabledList(scriptsEnabled))
    return this.scripts.filter(s => enabled.has(s.id))
  }

  runCommand = async ({command, args, message, lineInfo}) => {
    const orderedScriptsEnabled = this.getOrderedScriptsEnabled()
    for (const script of orderedScriptsEnabled) {
      const instance = this.scriptInstances[script.id]
      const commands = instance?.constructor?.commands
      if (!Array.isArray(commands)) continue
      const cmd = commands.find(c => c?.name === command)
      if (!cmd) continue
      try {
        const result = await cmd.run.call(instance, {
          command, args, message, ...lineInfo,
        })
        if (result?.replaceLine !== undefined) {
          const {text, lineStart, lineEnd} = lineInfo
          message.content = text.slice(0, lineStart) + result.replaceLine + text.slice(lineEnd)
        }
        const scriptsData = {}
        if (result?.data !== undefined) {
          scriptsData[script.id] = result.data
        }
        return {next: result?.next, scriptsData}
      } catch (e) {
        console.error(e)
        alert(`Command '/${command}' error:\n${e}`)
        return {next: undefined, scriptsData: {}}
      }
    }
    return {next: undefined, scriptsData: {}, noMatch: true}
  }

  runPostRequest = async (request, newMessage) => {
    for (const script of this.getOrderedScriptsEnabled()) {
      const instance = this.scriptInstances[script.id]
      if (!instance?.onPostRequest) continue
      try {
        await instance.onPostRequest(request, newMessage)
      } catch (e) {
        console.error(`onPostRequest error for script '${script.name}':`, e)
        alert(`onPostRequest error for script '${script.name}':\n${e}`)
      }
    }
  }

  runOnRequest = async (request, newMessage, messages, scriptsEnabled) => {
    const orderedScriptsEnabled = this.getOrderedScriptsEnabled(scriptsEnabled)
    console.log('Running scripts:', orderedScriptsEnabled.map(i => i.name))
    for (const script of orderedScriptsEnabled) {
      try {
        const instance = this.scriptInstances[script.id]
        if (instance?.onRequest) {
          await instance.onRequest(request, newMessage, messages)
        }
      } catch (e) {
        console.error(e)
        console.log('runLlmApi after script error:', request)
        alert(`Script '${script.name}' error:\n${e}`)
        return false
      }
    }
    console.log('runLlmApi after scripts:', request)
    return true
  }

  loadScripts = async () => {
    if (this.loadScriptsPromise) {
      this.loadScriptsQueued = true
      return
    }

    const doLoad = async () => {
      const newScripts = (await (await db).getAll('scripts'))
        .filter(i => (!i.sessionId || i.sessionId === this.sessionId))
        .sort((a, b) => (a.name.localeCompare(b.name)))

      const classRegex = /^class EimiScript/m
      const oldScriptsById = Object.fromEntries(this.scripts.map(s => [s.id, s]))

      const enabledSet = new Set(this.getScriptsEnabledList())
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
        const oldInstance = this.scriptInstances[scriptId]

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
            newInstances[scriptId] = new scriptClass({scriptId, eimiApi: this.eimiApi})
          } catch (e) {
            console.error(`Error instantiating script ${script.name}`, e)
            alert(`Error instantiating script ${script.name}:\n${e}`)
          }
        }
      }

      for (const scriptId in this.scriptInstances) {
        if (newInstances[scriptId]) continue
        const instance = this.scriptInstances[scriptId]
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

      this.scriptInstances = newInstances
      this.scripts = newScripts
    }

    this.loadScriptsPromise = doLoad()
    try {
      await this.loadScriptsPromise
    } finally {
      this.loadScriptsPromise = null
      if (this.loadScriptsQueued) {
        this.loadScriptsQueued = false
        this.loadScripts()
      }
    }
  }

  destroy = async () => {
    this.unsubscribeDbScripts?.()
    this.unsubscribeDbScripts = null
    for (const instance of Object.values(this.scriptInstances)) {
      if (!instance?.onDestroy) continue
      try {
        await instance.onDestroy()
      } catch (e) {
        console.error('Script onDestroy error:', e)
        alert(`Script onDestroy error:\n${e}`)
      }
    }
  }
}
