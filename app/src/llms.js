class ApiConfig {
  constructor({baseurl, token, model, completion, signal, proxy}) {
    this.baseurl = baseurl
    this.token = token
    this.model = model
    this.completion = completion
    this.signal = signal
    this.proxy = proxy
  }
}

function proxy(apiConfig, url) {
  if (!apiConfig.proxy) return url
  const proxyUrl = import.meta.env.DEV ? 'http://127.0.0.1:8000/proxy' : '/proxy'
  return `${proxyUrl}/${encodeURIComponent(url)}`
}

function formatErrorChunk(chunk) {
  return 'API error:\n' + (typeof chunk.error === "string" ?
    chunk.error : JSON.stringify(chunk.error, undefined, 2))
}

async function* streamOpenai(apiConfig, modelParams) {
  const jsonData = {
    stream: true,
    model: apiConfig.model,
    ...modelParams
  }

  let url
  if (apiConfig.baseurl && apiConfig.completion) {
    url = `${apiConfig.baseurl}completions`
  } else if (apiConfig.baseurl) {
    url = `${apiConfig.baseurl}chat/completions`
  } else if (apiConfig.completion) {
    url = 'https://api.openai.com/v1/completions'
  } else {
    url = 'https://api.openai.com/v1/chat/completions'
  }

  if (url.startsWith('https://api.openai.com/v1/')) {
    jsonData['stream_options'] = {include_usage: true}
  }

  // TODO: remove hacks
  if (url.startsWith('https://api.openai.com/v1/chat/completions')) {
    if (jsonData.model.startsWith('o1') || jsonData.model.startsWith('o3')) {
      delete jsonData['temperature']
    }
    jsonData['max_completion_tokens'] = jsonData['max_tokens']
    delete jsonData['max_tokens']
  }

  const response = await fetch(proxy(apiConfig, url), {
    signal: apiConfig.signal,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiConfig.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
  })

  if (!response.ok) {
    yield {error: await response.text()}
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const {value, done} = await reader.read()
    if (done) break

    buffer += decoder.decode(value, {stream: true})
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith('data: [DONE]')) return
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6))
      }
    }
  }
}

async function* openaiStreamResponse(apiConfig, modelParams) {
  for await (const chunk of streamOpenai(apiConfig, modelParams)) {
    if (chunk.error) {
      yield formatErrorChunk(chunk)
      continue
    }
    const usage = chunk?.usage || chunk?.x_groq?.usage
    if (usage) {
      yield {usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
      }}
    }
    try {
      const c = chunk.choices[0]
      if (!c) continue

      if ('text' in c) {
        yield c.text
      } else if (c.delta?.content) {
        yield c.delta.content
      } else if (c.delta?.reasoning) {  // OpenRouter
        yield {thinking: c.delta.reasoning}
      } else if (c.delta?.reasoning_content) {  // DeepSeek
        yield {thinking: c.delta.reasoning_content}
      }
    } catch (error) {
      yield 'Err: ' + JSON.stringify(chunk)
      throw error
    }
  }
}

const ANTHROPIC_API_PARAMS = [
  'max_tokens', 'messages', 'model', 'metadata', 'stop_sequences', 'stream',
  'system', 'temperature', 'thinking', 'tool_choice', 'tools', 'top_k', 'top_p',
]

async function* streamAnthropic(apiConfig, modelParams) {
  const jsonData = {
    stream: true,
    model: apiConfig.model,
  }
  for (const k of ANTHROPIC_API_PARAMS) {
    if (k in modelParams) {
      jsonData[k] = modelParams[k]
    }
  }

  const response = await fetch(proxy(apiConfig, 'https://api.anthropic.com/v1/messages'), {
    signal: apiConfig.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiConfig.token,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(jsonData)
  })

  if (!response.ok) {
    yield {error: await response.text()}
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const {value, done} = await reader.read()
    if (done) break

    buffer += decoder.decode(value, {stream: true})
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6))
      }
    }
  }
}

async function* anthropicStreamResponse(apiConfig, modelParams) {
  const params = {...modelParams}
  const systemMsgs = params.messages.filter(m => m.role === 'system')
  
  if (systemMsgs.length) {
    params.system = systemMsgs[0].content
    params.messages = params.messages.filter(m => m.role !== 'system')
  }

  params.messages = params.messages.map(message => {
    if (!Array.isArray(message.content)) return message

    return {...message, content: message.content.map(item => {
      if (item.type !== 'image_url') { return item }
      const imageUrl = item.image_url.url
      if (imageUrl.match(/^https?:/i)) {
        return {type: 'image', source: {type: 'url', url: imageUrl}}
      } else {
        let mediaType = 'image/jpeg'
        let data = imageUrl
        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          mediaType = match[1]
          data = match[2]
        }
        return {type: 'image', source: {type: 'base64', media_type: mediaType, data: data}}
      }
    })}
  })

  for await (const chunk of streamAnthropic(apiConfig, params)) {
    if (chunk.type === 'error') {
      yield 'API error:\n' + JSON.stringify(chunk, undefined, 2)
      continue
    }
    if (chunk.error) {
      yield formatErrorChunk(chunk)
      continue
    }
    if (chunk.type === 'message_start') {
      yield {usage: {prompt_tokens: chunk.message.usage.input_tokens}}
    }
    if (chunk.type === 'message_delta') {
      yield {usage: {completion_tokens: chunk?.usage?.output_tokens}}
    }
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text
    }
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'thinking_delta') {
      yield {thinking: chunk.delta.thinking}
    }
  }
}

async function* streamGoogle(apiConfig, modelParams) {
  const urlModel = encodeURIComponent(apiConfig.model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${urlModel}:streamGenerateContent?alt=sse&key=${apiConfig.token}`

  const response = await fetch(proxy(apiConfig, url), {
    signal: apiConfig.signal,
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(modelParams)
  })

  if (!response.ok) {
    yield {error: await response.text()}
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const {value, done} = await reader.read()
    if (done) break

    buffer += decoder.decode(value, {stream: true})
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6))
      }
    }
  }
}

async function* googleStreamResponse(apiConfig, modelParams) {
  const convertedData = {
    contents: [],
    generationConfig: {
      responseMimeType: "text/plain"
    },
    safetySettings: [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE'}
    ],
  }

  let messages = modelParams.messages
  const systemMsgs = messages.filter(m => m.role === 'system')

  if (systemMsgs.length) {
    convertedData.systemInstruction = {parts: [{text: systemMsgs[0].content}]}
    messages = messages.filter(m => m.role !== 'system')
  }

  for (const msg of messages) {
    const parts = []
  
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content })
    } else if (Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (item.type === 'text') {
          parts.push({ text: item.text })
        } else if (item.type === 'image_url') {
          const imageUrl = item.image_url.url
          if (imageUrl.match(/^https?:/i)) {
            // TODO: seems like Gemini only supports uploaded files, `gs://`
            parts.push({file_data: {mime_type: 'image/jpeg', file_uri: imageUrl}})
          } else {
            let mimeType = 'image/jpeg'
            let data = imageUrl
            const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
              mimeType = match[1]
              data = match[2]
            }
            parts.push({ inline_data: { mime_type: mimeType, data: data } })
          }
        }
      }
    }

    convertedData.contents.push({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts,
    })
  }

  if (modelParams.temperature != null) {
    convertedData.generationConfig.temperature = modelParams.temperature
  }
  if (modelParams.max_tokens != null) {
    convertedData.generationConfig.maxOutputTokens = modelParams.max_tokens
  }

  for await (const chunk of streamGoogle(apiConfig, convertedData)) {
    if (chunk.error) {
      yield formatErrorChunk(chunk)
      continue
    }
    yield {usage: {
      prompt_tokens: chunk.usageMetadata.promptTokenCount,
      completion_tokens: chunk.usageMetadata.candidatesTokenCount,
    }}
    yield chunk.candidates[0].content.parts[0].text
  }
}

export function runLlmApi(data) {
  const apiConfig = new ApiConfig({
    signal: data.signal,
    proxy: data.proxy,
    baseurl: data.baseurl,
    token: data.token,
    model: data.model,
    completion: data.completion,
  })

  const modelParams = {...data.parameters}

  if (apiConfig.completion) {
    modelParams.prompt = data.messages.map(m => m.content).join('')
  } else {
    modelParams.messages = data.messages
  }

  if (apiConfig.baseurl === 'google://') {
    return googleStreamResponse(apiConfig, modelParams)
  }

  if (apiConfig.baseurl === 'anthropic://') {
    return anthropicStreamResponse(apiConfig, modelParams)
  }

  return openaiStreamResponse(apiConfig, modelParams)
}
