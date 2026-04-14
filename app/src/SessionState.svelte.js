import { tick } from 'svelte'
import { db } from './db.js'
import {
  uniqueId, notifySessionList, relationalToLinear, omit, mergeOpenaiDiff,
} from './utils.js'
import { runLlmApi } from './llms.js'
import { CONFIG } from './config.svelte'
import { SessionScripts } from './SessionScripts.svelte.js'

export const USER = 'user'
export const ASSISTANT = 'assistant'
export const SYSTEM = 'system'

export class SessionState {
  sessionLoaded = $state(false)
  sessionData = $state()
  /**
   * @type {Array<{
   *   id: string,
   *   inputEl?: Element,
   *   createdAt?: number,
   *   parentId: string|null,
   *   role: string,
   *   content: string,
   *   thinking?: string,
   *   markdown?: Boolean,
   *   collapsed?: Boolean,
   *   parameters?: object,
   *   customData: Array<{key: string, value: string, renderer?: string}>,
   *   depth: number,
   *   ddepth: number,
   *   linear: boolean,
   *   lastInChain: boolean,
   *   generating?: boolean,
   *   promptTokens?: number,
   *   completionTokens?: number,
   *   finishReason?: string,
   *   aborter?: AbortController,
   * }>}
   */
  messages = $state([])
  stopSaving = false  // post destroy / session delete
  isNewSession = false
  isSessionTitleChanged = false
  saveTimeoutId = null
  lastSaveTime = Date.now()

  constructor({ sessionId, autoReply }) {
    this.sessionId = sessionId
    this.autoReply = autoReply
    this.sessionScripts = new SessionScripts({
      sessionId: this.sessionId,
      getMessages: () => this.messages,
      getSessionData: () => this.sessionData,
      apiGenResponse: this.apiGenResponse,
      createMessage: this.createMessage,
      updateTree: this.updateTree,
    })

    $effect(() => {
      window._sessionInfo = this.sessionData
    })

    $effect(() => {
      this.sessionData?.title
      this.isSessionTitleChanged = true
    })

    $effect(() => {  // Autosave
      // Touch all fields for reactivity
      this.sessionData?.title
      Object.keys(this.sessionData?.parameters || {})
      for (const i of this.messages) {  // TODO: is there a better way?
        i.parentId
        i.role
        i.content
        i.markdown
        i.collapsed
        i.customData.forEach(d => { d.value; d.renderer })
      }
      window._sessionMessages = this.messages
      this.scheduleSave()
    })
  }

  updateTree = async () => {
    await tick()
    this.messages = relationalToLinear(this.messages)
    await tick()
  }

  saveSession = async (sessionId = this.sessionId) => {
    if (this.stopSaving) return
    if (!this.sessionLoaded) return
    if (this.isNewSession && this.messages.length === 1 && this.messages[0].content === '') return
    const obj = {
      ...$state.snapshot(this.sessionData),
      messages: this.messages.map(
        ({id, createdAt, parentId, markdown, role, content, thinking, customData, parameters, collapsed}) => ({
          id,
          createdAt,
          parentId,
          markdown,
          role,
          content,
          thinking,
          customData: $state.snapshot(customData),
          parameters: $state.snapshot(parameters),
          collapsed,
        })
      ),
    }
    await (await db).put('sessionMeta', {
      id: sessionId,
      title: obj.title,
      createdAt: obj.createdAt,
    })
    await (await db).put('sessions', obj, sessionId)
    if (this.isNewSession || this.isSessionTitleChanged) {
      notifySessionList()
      this.isNewSession = false
      this.isSessionTitleChanged = false
    }
  }

  deleteSession = async () => {
    this.stopSaving = true
    const tx = (await db).transaction(['sessions', 'sessionMeta', 'scripts'], 'readwrite')
    await tx.objectStore('sessions').delete(this.sessionId)
    await tx.objectStore('sessionMeta').delete(this.sessionId)
    const allScripts = await tx.objectStore('scripts').getAll()
    for (const script of allScripts) {
      if (script.sessionId === this.sessionId) await tx.objectStore('scripts').delete(script.id)
    }
    await tx.done
    notifySessionList()
  }

  loadSession = async () => {
    let obj = await (await db).get('sessions', this.sessionId)
    if (obj === undefined) {
      this.isNewSession = true
      this.sessionData = {
        title: (new Date()).toLocaleString(),
        createdAt: new Date().valueOf(),
        parameters: {
          scriptsEnabled: (await (await db).getAll('scripts'))
            .filter(script => script.enabled)
            .map(script => script.id),
          temperature: 0,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          max_tokens: 0,
        },
      }
      this.createMessage()
      this.sessionLoaded = true
      await tick()

      if (this.autoReply) {
        this.messages[0].content = this.autoReply
        this.autoReply = undefined
        this.genResponse(this.messages[0])
      }
      return
    }
    const meta = await (await db).get('sessionMeta', this.sessionId)
    obj.title = meta.title
    obj.createdAt = meta.createdAt
    if (!obj.parameters) obj.parameters = {}
    const {messages: loadedMessages, ...rest} = obj
    for (const m of loadedMessages) if (!m.customData) m.customData = []
    this.sessionData = rest
    this.messages = relationalToLinear(loadedMessages)
    this.sessionLoaded = true
  }

  _saveSession = async () => {
    await this.saveSession(this.sessionId)
    this.lastSaveTime = Date.now()
  }

  scheduleSave = (t = 500) => {
    if (this.saveTimeoutId !== null) clearTimeout(this.saveTimeoutId)
    if ((Date.now() - this.lastSaveTime) >= 2000) t = 0
    this.saveTimeoutId = setTimeout(this._saveSession, t)
  }

  setTitle = async (title) => {
    this.sessionData.title = title
    await (await db).put('sessionMeta', {
      id: this.sessionId,
      title: this.sessionData.title,
      createdAt: this.sessionData.createdAt,
    })
    notifySessionList()
  }

  createMessage = (values, index = 0) => {
    const newMessage = {
      id: uniqueId(),
      createdAt: new Date().valueOf(),
      parentId: null,
      role: USER,
      content: '',
      thinking: '',
      generating: false,
      markdown: false,
      customData: [],
      ...values,
    }
    const insertIndex = index === -1 ? this.messages.length : index
    this.messages.splice(insertIndex, 0, newMessage)
    const messageWithProxy = this.messages[insertIndex]
    this.messages = relationalToLinear(this.messages)
    return messageWithProxy
  }

  getChain = (message, regenerate = false) => {
    const chain = regenerate ? [] : [message]
    while (message = this.messages.find(p => p.id === message.parentId)) chain.unshift(message)
    return chain
  }

  apiGenResponse = (messageId, paramsReplace) => {
    const message = this.messages.find(m => m.id === messageId)
    if (message) return this.genResponse(message, false, paramsReplace)
  }

  genResponse = async (message, regenerate = false, paramsReplace, scriptsData) => {
    const params = paramsReplace || $state.snapshot(this.sessionData.parameters)
    console.log('_genResponse', $state.snapshot(message), regenerate, params)

    const apiData = CONFIG.apis[params._api]
    if (!apiData.token) {
      alert(`Add token in settings for "${params._api}"`)
      throw Error('no token')
    }
    const modelInfo = CONFIG.models.find(i => (i.api === params._api && i.id === params.model))

    if (location.hostname === 'eimi.cns.wtf') {
      fetch('https://ut.cns.wtf/api/record/ei' + ' mi_gen'.trim())
    }

    let newMessage
    if (!regenerate) {
      newMessage = this.createMessage({
        parentId: message.id,
        role: ASSISTANT,
        generating: true,
        markdown: true,
        parameters: {...params},
      })
    } else {
      newMessage = message
      newMessage.content = ''
      newMessage.thinking = ''
      newMessage.generating = true
      newMessage.promptTokens = undefined
      newMessage.completionTokens = undefined
      newMessage.parameters = {...params}
    }
    newMessage.aborter?.abort()
    const aborter = new AbortController()
    newMessage.aborter = aborter
    await tick()

    const request = {
      createdAt: new Date(),
      runner: runLlmApi,
      signal: aborter.signal,
      proxy: apiData.proxy === false ? false : true,
      baseurl: apiData.baseurl,
      token: apiData.token,
      model: params.model,
      completion: modelInfo.completion,
      sessionParameters: params,
      parameters: omit(params, ['_api', 'model', 'scriptsEnabled', 'max_tokens']),
      scriptsData: scriptsData || {},
      messages: this.getChain(message, regenerate).map(({id, role, thinking, content}) => ({
        _id: id,
        role,
        _thinking: thinking,
        content: [{type: 'text', text: content}],
      })),
    }
    if (request.baseurl.startsWith('anthropic') && params.max_tokens === 0) {
      request.parameters.max_tokens = modelInfo.max_tokens
    } else if (params.max_tokens !== 0) {
      request.parameters.max_tokens = params.max_tokens
    }

    console.log('runLlmApi before scripts:', {
      ...request,
      parameters: JSON.parse(JSON.stringify(request.parameters)),
      messages: JSON.parse(JSON.stringify(request.messages)),
    })

    const scriptsOk = await this.sessionScripts.runOnRequest(
      request,
      newMessage,
      this.messages,
      params.scriptsEnabled
    )
    if (!scriptsOk) {
      newMessage.generating = false
      return
    }

    try {
      const tool_calls = []
      newMessage.content = ''
      for await (const chunk of request.runner(request)) {
        if (typeof chunk === 'string') {
          newMessage.content += chunk
        } else {
          if (chunk?.usage?.prompt_tokens) newMessage.promptTokens = chunk.usage.prompt_tokens
          if (chunk?.usage?.completion_tokens) newMessage.completionTokens = chunk.usage.completion_tokens
          if (chunk?.thinking) newMessage.thinking += chunk.thinking
          if (chunk?.tool_call_delta) {
            const { index, ...diff } = chunk.tool_call_delta
            if (tool_calls[index] === undefined) tool_calls[index] = {}
            const accumulated_tool_call = tool_calls[index]
            mergeOpenaiDiff(accumulated_tool_call, diff)

            const key = `toolcall_${index}`
            let tcData = newMessage.customData.find(d => d.key === key)
            if (!tcData) {
              tcData = {key, value: ''}
              newMessage.customData.push(tcData)
            }
            tcData.value = JSON.stringify(accumulated_tool_call, null, 2)
          }
          if (chunk?.finishReason) newMessage.finishReason = chunk.finishReason
        }
        await tick()
      }
    } catch (e) {
      if (e.name === 'AbortError') return
      console.error(e)
      alert(`Request error:\n${e}`)
    } finally {
      newMessage.generating = false
      await this.sessionScripts.runPostRequest(request, newMessage)
    }
    return {newMessage, request}
  }

  deleteMessageTree = async (messageId) => {
    const msg = this.messages.find(i => i.id === messageId)
    if (!msg) return
    msg.aborter?.abort()
    await tick()

    const idsToDelete = [msg.id]
    const addChildren = (current) => {
      const children = this.messages.filter(i => i.parentId === current.id)
      for (const child of children) {
        child.aborter?.abort()
        idsToDelete.push(child.id)
        addChildren(child)
      }
    }
    addChildren(msg)

    this.messages = relationalToLinear(this.messages.filter(i => !idsToDelete.includes(i.id)))
    this.scheduleSave(0)
  }

  moveMessage = async (messageId, direction) => {
    const currentIndex = this.messages.findIndex(m => m.id === messageId)
    if (currentIndex === -1) return
    const current = this.messages[currentIndex]

    if (direction === 'up') {
      if (currentIndex === 0) return
      const up = this.messages[currentIndex - 1]
      if (up.id === current.parentId) {
        // Case 1: up is shallower (is parent), becoming sibling and moving higher
        current.parentId = up.parentId
        this.messages[currentIndex - 1] = current
        this.messages[currentIndex] = up
      } else {
        // Case 2: up is same depth, set as parent
        // Case 3: up is deeper, drill up till same depth
        let i = currentIndex - 1
        while (i >= 0 && this.messages[i].depth > current.depth) i--
        current.parentId = this.messages[i].id
      }
    } else if (direction === 'down') {
      // Drilling past children
      let i = currentIndex + 1
      while (i < this.messages.length && this.messages[i].depth > current.depth) i++
      const down = this.messages[i]
      if (down?.depth === current.depth) {
        // Case 4: down is same depth, set as parent
        current.parentId = down.id
      } else {
        // Case 5: down is shallower OR end of messages, set parent to .parent.parent
        const parent = this.messages.find(m => m.id === current.parentId)
        current.parentId = parent ? parent.parentId : null
      }
    }

    this.messages = relationalToLinear(this.messages)
    return current.id
  }

  destroy = async () => {
    for (const i of this.messages) i.aborter?.abort()
    clearTimeout(this.saveTimeoutId)
    await this.sessionScripts.destroy()
    await this.saveSession(this.sessionId)
    this.stopSaving = true
  }
}
