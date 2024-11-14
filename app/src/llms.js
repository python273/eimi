class ApiConfig {
	constructor({baseurl, token, model, completion, signal, proxy}) {
		this.baseurl = baseurl;
		this.token = token;
		this.model = model;
		this.completion = completion;
		this.signal = signal;
		this.proxy = proxy;
	}
}

function proxy(apiConfig, url) {
	if (!apiConfig.proxy) return url;
	const proxyUrl = import.meta.env.DEV ? 
		'http://127.0.0.1:8000/proxy' : 
		'/proxy';
	return `${proxyUrl}/${encodeURIComponent(url)}`;
}

function formatErrorChunk(chunk) {
	return 'API error:\n' + (typeof chunk.error === "string" ?
		chunk.error : JSON.stringify(chunk.error, undefined, 2));
}

async function* streamOpenai(apiConfig, modelParams) {
	const jsonData = {
		stream: true,
		model: apiConfig.model,
		...modelParams
	};

	let url;
	if (apiConfig.baseurl && apiConfig.completion) {
		url = `${apiConfig.baseurl}completions`;
	} else if (apiConfig.baseurl) {
		url = `${apiConfig.baseurl}chat/completions`;
	} else if (apiConfig.completion) {
		url = 'https://api.openai.com/v1/completions';
	} else {
		url = 'https://api.openai.com/v1/chat/completions';
	}

	if (url.startsWith('https://api.openai.com/v1/')) {
		jsonData['stream_options'] = {include_usage: true};
	}

	const response = await fetch(proxy(apiConfig, url), {
		signal: apiConfig.signal,
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiConfig.token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(jsonData)
	});

	if (!response.ok) {
		yield {error: await response.text()};
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const {value, done} = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, {stream: true});
		const lines = buffer.split('\n');
		buffer = lines.pop();

		for (const line of lines) {
			if (line.startsWith('data: [DONE]')) return;
			if (line.startsWith('data: ')) {
				yield JSON.parse(line.slice(6));
			}
		}
	}
}

async function* openaiStreamResponse(apiConfig, modelParams) {
	for await (const chunk of streamOpenai(apiConfig, modelParams)) {
		if (chunk.error) {
			yield formatErrorChunk(chunk);
			continue;
		}
		const usage = chunk?.usage || chunk?.x_groq?.usage;
		if (usage) {
			yield {usage: {
				prompt_tokens: usage.prompt_tokens,
				completion_tokens: usage.completion_tokens,
			}};
		}
		try {
			const c = chunk.choices[0];
			if (!c) continue;

			if ('text' in c) {
				yield c.text;
			} else if (c.delta?.content) {
				yield c.delta.content;
			}
		} catch (error) {
			yield 'Err: ' + JSON.stringify(chunk);
			throw error;
		}
	}
}

const ANTHROPIC_API_PARAMS = [
	'model', 'messages', 'max_tokens', 'metadata', 'stop_sequences', 'stream',
	'system', 'temperature', 'tool_choice', 'tools', 'top_k', 'top_p'
];

async function* streamAnthropic(apiConfig, modelParams) {
	const jsonData = {
		stream: true,
		model: apiConfig.model,
	};
	for (const k of ANTHROPIC_API_PARAMS) {
		if (k in modelParams) {
			jsonData[k] = modelParams[k];
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
	});

	if (!response.ok) {
		yield {error: await response.text()};
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const {value, done} = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, {stream: true});
		const lines = buffer.split('\n');
		buffer = lines.pop();

		for (const line of lines) {
			if (line.startsWith('data: ')) {
				yield JSON.parse(line.slice(6));
			}
		}
	}
}

async function* anthropicStreamResponse(apiConfig, modelParams) {
	const messages = modelParams.messages;
	const systemMsgs = messages.filter(m => m.role === 'system');

	const anthropicParams = {...modelParams};
	if (systemMsgs.length) {
		anthropicParams.system = systemMsgs[0].content;
		anthropicParams.messages = messages.filter(m => m.role !== 'system');
	}

	for await (const chunk of streamAnthropic(apiConfig, anthropicParams)) {
		if (chunk.type === 'error') {
			yield 'API error:\n' + JSON.stringify(chunk, undefined, 2);
			continue;
		}
		if (chunk.error) {
			yield formatErrorChunk(chunk);
			continue;
		}
		if (chunk.type === 'message_start') {
			yield {usage: {prompt_tokens: chunk.message.usage.input_tokens}};
		}
		if (chunk.type === 'message_delta') {
			yield {usage: {completion_tokens: chunk?.usage?.output_tokens}};
		}
		if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
			yield chunk.delta.text;
		}
	}
}

async function* streamGoogle(apiConfig, modelParams) {
	const urlModel = encodeURIComponent(apiConfig.model);
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${urlModel}:streamGenerateContent?alt=sse&key=${apiConfig.token}`;

	const response = await fetch(proxy(apiConfig, url), {
		signal: apiConfig.signal,
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(modelParams)
	});

	if (!response.ok) {
		yield {error: await response.text()};
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const {value, done} = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, {stream: true});
		const lines = buffer.split('\n');
		buffer = lines.pop();

		for (const line of lines) {
			if (line.startsWith('data: ')) {
				yield JSON.parse(line.slice(6));
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
	};

	let messages = modelParams.messages;
	const systemMsgs = messages.filter(m => m.role === 'system');

	if (systemMsgs.length) {
		convertedData.systemInstruction = {parts: [{text: systemMsgs[0].content}]};
		messages = messages.filter(m => m.role !== 'system');
	}

	for (const msg of messages) {
		convertedData.contents.push({
			role: msg.role === 'assistant' ? 'model' : msg.role,
			parts: typeof msg.content === 'string' ? [{text: msg.content}] : msg.content
		});
	}

	if (modelParams.temperature != null) {
		convertedData.generationConfig.temperature = modelParams.temperature;
	}
	if (modelParams.max_tokens != null) {
		convertedData.generationConfig.maxOutputTokens = modelParams.max_tokens;
	}

	for await (const chunk of streamGoogle(apiConfig, convertedData)) {
		if (chunk.error) {
			yield formatErrorChunk(chunk);
			continue;
		}
		yield {usage: {
			prompt_tokens: chunk.usageMetadata.promptTokenCount,
			completion_tokens: chunk.usageMetadata.candidatesTokenCount,
		}};
		yield chunk.candidates[0].content.parts[0].text;
	}
}

function streamResponse(apiConfig, modelParams) {
	if (apiConfig.baseurl === 'google://') {
		return googleStreamResponse(apiConfig, modelParams);
	}

	if (apiConfig.baseurl === 'anthropic://' || apiConfig.baseurl === 'https://api.anthropic.com/v1/messages') {
		return anthropicStreamResponse(apiConfig, modelParams);
	}

	return openaiStreamResponse(apiConfig, modelParams);
}

export function runLlmApi(data) {  // TODO: separate data into separate args
	const apiConfig = new ApiConfig({
		token: data.token,
		baseurl: data.baseurl,
		model: data.model,
		completion: Boolean(data.completion),
		signal: data.signal,
		proxy: data.proxy,
	});

	const modelParams = {
		temperature: parseFloat(data.temperature),
		top_p: parseFloat(data.top_p || 1.0),
		frequency_penalty: parseFloat(data.frequency_penalty),
		presence_penalty: parseFloat(data.presence_penalty)
	};

	if (apiConfig.completion) {
		modelParams.prompt = data.messages.map(m => m.content).join('');
	} else {
		modelParams.messages = data.messages;
	}

	if (data.max_tokens !== 0) {
		modelParams.max_tokens = data.max_tokens;
	}

	if (data.stop) {
		modelParams.stop = data.stop;
	}

	return streamResponse(apiConfig, modelParams);
}
