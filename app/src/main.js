import './global.css'
import App from './App.svelte'

window.addEventListener('unload', function(){});
window.addEventListener('beforeunload', function(){});

if (localStorage.getItem('cfg-config') === null) {
	localStorage['cfg-config'] = `{
  "apis": {
    "oai": {
      "baseurl": "https://api.openai.com/v1/",
      "token": ""
    },
    "or": {
      "baseurl": "https://openrouter.ai/api/v1/",
      "token": ""
    },
    "ant": {
      "baseurl": "https://api.anthropic.com/v1/messages",
      "token": ""
    },
    "tog": {
      "baseurl": "https://api.together.xyz/v1/",
      "token": ""
    },
    "firew": {
      "baseurl": "https://api.fireworks.ai/inference/v1/",
      "token": ""
    },
    "hyperbolic": {
      "baseurl": "https://api.hyperbolic.xyz/v1/",
      "token": ""
    }
  },
  "models": [
    {
      "api": "firew",
      "id": "accounts/fireworks/models/llama-v3p1-405b-instruct",
      "name": "fireworks/llama-v3p1-405b-instruct",
      "max_tokens": 4096
    },
    {
      "api": "tog",
      "id": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      "name": "together/Meta-Llama-3.1-405B-Instruct-Turbo",
      "max_tokens": 4096
    },
    {
      "api": "hyperbolic",
      "id": "meta-llama/Meta-Llama-3.1-405B-Instruct",
      "name": "hyperbolic/Meta-Llama-3.1-405B-Instruct",
      "max_tokens": 4096
    },
    {
      "api": "hyperbolic",
      "id": "meta-llama/Meta-Llama-3.1-405B-FP8",
      "name": "hyperbolic/Meta-Llama-3.1-405B-FP8",
      "max_tokens": 4096,
      "completion": true
    },
    {
      "api": "ant",
      "id": "claude-3-opus-20240229",
      "name": "claude-3-opus-20240229",
      "max_tokens": 4096
    },
    {
      "api": "ant",
      "id": "claude-3-sonnet-20240229",
      "name": "claude-3-sonnet-20240229",
      "max_tokens": 4096
    },
    {
      "api": "ant",
      "id": "claude-3-haiku-20240307",
      "name": "claude-3-haiku-20240307",
      "max_tokens": 4096
    },
    {
      "api": "ant",
      "id": "claude-3-5-sonnet-20240620",
      "name": "claude-3-5-sonnet-20240620",
      "max_tokens": 4096
    },
    {
      "api": "oai",
      "id": "gpt-4-0314",
      "name": "gpt-4-0314",
      "max_tokens": 8192
    },
    {
      "api": "oai",
      "id": "gpt-4-0613",
      "name": "gpt-4-0613",
      "max_tokens": 8192
    },
    {
      "api": "oai",
      "id": "gpt-4-1106-preview",
      "name": "gpt-4-1106-preview",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4-0125-preview",
      "name": "gpt-4-0125-preview",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4-turbo-2024-04-09",
      "name": "gpt-4-turbo-2024-04-09",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4o-2024-05-13",
      "name": "gpt-4o-2024-05-13",
      "max_tokens": 128000,
      "defaultModel": true
    },
    {
      "api": "oai",
      "id": "gpt-4o-2024-08-06",
      "name": "gpt-4o-2024-08-06"
    },
    {
      "api": "oai",
      "id": "gpt-4o-mini-2024-07-18",
      "name": "gpt-4o-mini-2024-07-18",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4",
      "name": "gpt-4",
      "max_tokens": 8192
    },
    {
      "api": "oai",
      "id": "gpt-4-turbo",
      "name": "gpt-4-turbo",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4o",
      "name": "gpt-4o",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4o-mini",
      "name": "gpt-4o-mini",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-instruct",
      "name": "gpt-3.5-turbo-instruct",
      "max_tokens": 4096,
      "completion": true
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-instruct-0914",
      "name": "gpt-3.5-turbo-instruct-0914",
      "max_tokens": 4096,
      "completion": true
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo",
      "name": "gpt-3.5-turbo",
      "max_tokens": 16385
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-16k",
      "name": "gpt-3.5-turbo-16k",
      "max_tokens": 16385
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-1106",
      "name": "gpt-3.5-turbo-1106",
      "max_tokens": 16385
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-0125",
      "name": "gpt-3.5-turbo-0125",
      "max_tokens": 16385
    },
    {
      "api": "or",
      "id": "01-ai/yi-34b",
      "name": "01-ai/yi-34b Yi 34B (base)"
    },
    {
      "api": "or",
      "id": "01-ai/yi-34b-chat",
      "name": "01-ai/yi-34b-chat Yi 34B Chat"
    },
    {
      "api": "or",
      "id": "01-ai/yi-6b",
      "name": "01-ai/yi-6b Yi 6B (base)"
    },
    {
      "api": "or",
      "id": "01-ai/yi-large",
      "name": "01-ai/yi-large 01.AI: Yi Large"
    },
    {
      "api": "or",
      "id": "01-ai/yi-large-fc",
      "name": "01-ai/yi-large-fc 01.AI: Yi Large FC"
    },
    {
      "api": "or",
      "id": "01-ai/yi-large-turbo",
      "name": "01-ai/yi-large-turbo 01.AI: Yi Large Turbo"
    },
    {
      "api": "or",
      "id": "01-ai/yi-vision",
      "name": "01-ai/yi-vision 01.AI: Yi Vision"
    },
    {
      "api": "or",
      "id": "ai21/jamba-instruct",
      "name": "ai21/jamba-instruct AI21: Jamba Instruct"
    },
    {
      "api": "or",
      "id": "allenai/olmo-7b-instruct",
      "name": "allenai/olmo-7b-instruct OLMo 7B Instruct"
    },
    {
      "api": "or",
      "id": "alpindale/goliath-120b",
      "name": "alpindale/goliath-120b Goliath 120B"
    },
    {
      "api": "or",
      "id": "alpindale/magnum-72b",
      "name": "alpindale/magnum-72b Magnum 72B"
    },
    {
      "api": "or",
      "id": "anthropic/claude-1",
      "name": "anthropic/claude-1 Anthropic: Claude v1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-1.2",
      "name": "anthropic/claude-1.2 Anthropic: Claude v1.2"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2",
      "name": "anthropic/claude-2 Anthropic: Claude v2"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.0",
      "name": "anthropic/claude-2.0 Anthropic: Claude v2.0"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.0:beta",
      "name": "anthropic/claude-2.0:beta Anthropic: Claude v2.0 (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.1",
      "name": "anthropic/claude-2.1 Anthropic: Claude v2.1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.1:beta",
      "name": "anthropic/claude-2.1:beta Anthropic: Claude v2.1 (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2:beta",
      "name": "anthropic/claude-2:beta Anthropic: Claude v2 (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-haiku",
      "name": "anthropic/claude-3-haiku Anthropic: Claude 3 Haiku"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-haiku:beta",
      "name": "anthropic/claude-3-haiku:beta Anthropic: Claude 3 Haiku (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-opus",
      "name": "anthropic/claude-3-opus Anthropic: Claude 3 Opus"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-opus:beta",
      "name": "anthropic/claude-3-opus:beta Anthropic: Claude 3 Opus (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-sonnet",
      "name": "anthropic/claude-3-sonnet Anthropic: Claude 3 Sonnet"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3-sonnet:beta",
      "name": "anthropic/claude-3-sonnet:beta Anthropic: Claude 3 Sonnet (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3.5-sonnet",
      "name": "anthropic/claude-3.5-sonnet Anthropic: Claude 3.5 Sonnet"
    },
    {
      "api": "or",
      "id": "anthropic/claude-3.5-sonnet:beta",
      "name": "anthropic/claude-3.5-sonnet:beta Anthropic: Claude 3.5 Sonnet (self-moderated)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1",
      "name": "anthropic/claude-instant-1 Anthropic: Claude Instant v1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1.0",
      "name": "anthropic/claude-instant-1.0 Anthropic: Claude Instant v1.0"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1.1",
      "name": "anthropic/claude-instant-1.1 Anthropic: Claude Instant v1.1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1:beta",
      "name": "anthropic/claude-instant-1:beta Anthropic: Claude Instant v1 (self-moderated)"
    },
    {
      "api": "or",
      "id": "austism/chronos-hermes-13b",
      "name": "austism/chronos-hermes-13b Chronos Hermes 13B v2"
    },
    {
      "api": "or",
      "id": "cognitivecomputations/dolphin-llama-3-70b",
      "name": "cognitivecomputations/dolphin-llama-3-70b Dolphin Llama 3 70B \ud83d\udc2c"
    },
    {
      "api": "or",
      "id": "cognitivecomputations/dolphin-mixtral-8x22b",
      "name": "cognitivecomputations/dolphin-mixtral-8x22b Dolphin 2.9.2 Mixtral 8x22B \ud83d\udc2c"
    },
    {
      "api": "or",
      "id": "cognitivecomputations/dolphin-mixtral-8x7b",
      "name": "cognitivecomputations/dolphin-mixtral-8x7b Dolphin 2.6 Mixtral 8x7B \ud83d\udc2c"
    },
    {
      "api": "or",
      "id": "cohere/command",
      "name": "cohere/command Cohere: Command"
    },
    {
      "api": "or",
      "id": "cohere/command-r",
      "name": "cohere/command-r Cohere: Command R"
    },
    {
      "api": "or",
      "id": "cohere/command-r-plus",
      "name": "cohere/command-r-plus Cohere: Command R+"
    },
    {
      "api": "or",
      "id": "databricks/dbrx-instruct",
      "name": "databricks/dbrx-instruct Databricks: DBRX 132B Instruct"
    },
    {
      "api": "or",
      "id": "deepseek/deepseek-chat",
      "name": "deepseek/deepseek-chat DeepSeek-V2 Chat"
    },
    {
      "api": "or",
      "id": "deepseek/deepseek-coder",
      "name": "deepseek/deepseek-coder DeepSeek-Coder-V2"
    },
    {
      "api": "or",
      "id": "fireworks/firellava-13b",
      "name": "fireworks/firellava-13b FireLLaVA 13B"
    },
    {
      "api": "or",
      "id": "google/gemini-flash-1.5",
      "name": "google/gemini-flash-1.5 Google: Gemini Flash 1.5"
    },
    {
      "api": "or",
      "id": "google/gemini-pro",
      "name": "google/gemini-pro Google: Gemini Pro 1.0"
    },
    {
      "api": "or",
      "id": "google/gemini-pro-1.5",
      "name": "google/gemini-pro-1.5 Google: Gemini Pro 1.5"
    },
    {
      "api": "or",
      "id": "google/gemini-pro-1.5-exp",
      "name": "google/gemini-pro-1.5-exp Google: Gemini Pro 1.5 (0801)"
    },
    {
      "api": "or",
      "id": "google/gemini-pro-vision",
      "name": "google/gemini-pro-vision Google: Gemini Pro Vision 1.0"
    },
    {
      "api": "or",
      "id": "google/gemma-2-27b-it",
      "name": "google/gemma-2-27b-it Google: Gemma 2 27B"
    },
    {
      "api": "or",
      "id": "google/gemma-2-9b-it",
      "name": "google/gemma-2-9b-it Google: Gemma 2 9B"
    },
    {
      "api": "or",
      "id": "google/gemma-2-9b-it:free",
      "name": "google/gemma-2-9b-it:free Google: Gemma 2 9B (free)"
    },
    {
      "api": "or",
      "id": "google/gemma-7b-it",
      "name": "google/gemma-7b-it Google: Gemma 7B"
    },
    {
      "api": "or",
      "id": "google/gemma-7b-it:free",
      "name": "google/gemma-7b-it:free Google: Gemma 7B (free)"
    },
    {
      "api": "or",
      "id": "google/gemma-7b-it:nitro",
      "name": "google/gemma-7b-it:nitro Google: Gemma 7B (nitro)"
    },
    {
      "api": "or",
      "id": "google/palm-2-chat-bison",
      "name": "google/palm-2-chat-bison Google: PaLM 2 Chat"
    },
    {
      "api": "or",
      "id": "google/palm-2-chat-bison-32k",
      "name": "google/palm-2-chat-bison-32k Google: PaLM 2 Chat 32k"
    },
    {
      "api": "or",
      "id": "google/palm-2-codechat-bison",
      "name": "google/palm-2-codechat-bison Google: PaLM 2 Code Chat"
    },
    {
      "api": "or",
      "id": "google/palm-2-codechat-bison-32k",
      "name": "google/palm-2-codechat-bison-32k Google: PaLM 2 Code Chat 32k"
    },
    {
      "api": "or",
      "id": "gryphe/mythomax-l2-13b",
      "name": "gryphe/mythomax-l2-13b MythoMax 13B"
    },
    {
      "api": "or",
      "id": "gryphe/mythomax-l2-13b:extended",
      "name": "gryphe/mythomax-l2-13b:extended MythoMax 13B (extended)"
    },
    {
      "api": "or",
      "id": "gryphe/mythomax-l2-13b:nitro",
      "name": "gryphe/mythomax-l2-13b:nitro MythoMax 13B (nitro)"
    },
    {
      "api": "or",
      "id": "gryphe/mythomist-7b",
      "name": "gryphe/mythomist-7b MythoMist 7B"
    },
    {
      "api": "or",
      "id": "gryphe/mythomist-7b:free",
      "name": "gryphe/mythomist-7b:free MythoMist 7B (free)"
    },
    {
      "api": "or",
      "id": "huggingfaceh4/zephyr-7b-beta:free",
      "name": "huggingfaceh4/zephyr-7b-beta:free Hugging Face: Zephyr 7B (free)"
    },
    {
      "api": "or",
      "id": "jondurbin/airoboros-l2-70b",
      "name": "jondurbin/airoboros-l2-70b Airoboros 70B"
    },
    {
      "api": "or",
      "id": "lizpreciatior/lzlv-70b-fp16-hf",
      "name": "lizpreciatior/lzlv-70b-fp16-hf lzlv 70B"
    },
    {
      "api": "or",
      "id": "lynn/soliloquy-l3",
      "name": "lynn/soliloquy-l3 Lynn: Llama 3 Soliloquy 8B v2"
    },
    {
      "api": "or",
      "id": "mancer/weaver",
      "name": "mancer/weaver Mancer: Weaver (alpha)"
    },
    {
      "api": "or",
      "id": "meta-llama/codellama-34b-instruct",
      "name": "meta-llama/codellama-34b-instruct Meta: CodeLlama 34B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/codellama-70b-instruct",
      "name": "meta-llama/codellama-70b-instruct Meta: CodeLlama 70B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-2-13b-chat",
      "name": "meta-llama/llama-2-13b-chat Meta: Llama v2 13B Chat"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-2-70b-chat",
      "name": "meta-llama/llama-2-70b-chat Meta: Llama v2 70B Chat"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-70b",
      "name": "meta-llama/llama-3-70b Meta: Llama 3 70B (Base)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-70b-instruct",
      "name": "meta-llama/llama-3-70b-instruct Meta: Llama 3 70B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-70b-instruct:nitro",
      "name": "meta-llama/llama-3-70b-instruct:nitro Meta: Llama 3 70B Instruct (nitro)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-8b",
      "name": "meta-llama/llama-3-8b Meta: Llama 3 8B (Base)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-8b-instruct",
      "name": "meta-llama/llama-3-8b-instruct Meta: Llama 3 8B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-8b-instruct:extended",
      "name": "meta-llama/llama-3-8b-instruct:extended Meta: Llama 3 8B Instruct (extended)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-8b-instruct:free",
      "name": "meta-llama/llama-3-8b-instruct:free Meta: Llama 3 8B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3-8b-instruct:nitro",
      "name": "meta-llama/llama-3-8b-instruct:nitro Meta: Llama 3 8B Instruct (nitro)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-405b",
      "name": "meta-llama/llama-3.1-405b Meta: Llama 3.1 405B (base)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-405b-instruct",
      "name": "meta-llama/llama-3.1-405b-instruct Meta: Llama 3.1 405B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-70b-instruct",
      "name": "meta-llama/llama-3.1-70b-instruct Meta: Llama 3.1 70B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-8b-instruct",
      "name": "meta-llama/llama-3.1-8b-instruct Meta: Llama 3.1 8B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-8b-instruct:free",
      "name": "meta-llama/llama-3.1-8b-instruct:free Meta: Llama 3.1 8B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-guard-2-8b",
      "name": "meta-llama/llama-guard-2-8b Meta: LlamaGuard 2 8B"
    },
    {
      "api": "or",
      "id": "microsoft/phi-3-medium-128k-instruct",
      "name": "microsoft/phi-3-medium-128k-instruct Phi-3 Medium 128K Instruct"
    },
    {
      "api": "or",
      "id": "microsoft/phi-3-medium-128k-instruct:free",
      "name": "microsoft/phi-3-medium-128k-instruct:free Phi-3 Medium 128K Instruct (free)"
    },
    {
      "api": "or",
      "id": "microsoft/phi-3-medium-4k-instruct",
      "name": "microsoft/phi-3-medium-4k-instruct Phi-3 Medium 4K Instruct"
    },
    {
      "api": "or",
      "id": "microsoft/phi-3-mini-128k-instruct",
      "name": "microsoft/phi-3-mini-128k-instruct Phi-3 Mini 128K Instruct"
    },
    {
      "api": "or",
      "id": "microsoft/phi-3-mini-128k-instruct:free",
      "name": "microsoft/phi-3-mini-128k-instruct:free Phi-3 Mini 128K Instruct (free)"
    },
    {
      "api": "or",
      "id": "microsoft/wizardlm-2-7b",
      "name": "microsoft/wizardlm-2-7b WizardLM-2 7B"
    },
    {
      "api": "or",
      "id": "microsoft/wizardlm-2-8x22b",
      "name": "microsoft/wizardlm-2-8x22b WizardLM-2 8x22B"
    },
    {
      "api": "or",
      "id": "mistralai/codestral-mamba",
      "name": "mistralai/codestral-mamba Mistral: Codestral Mamba"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct",
      "name": "mistralai/mistral-7b-instruct Mistral: Mistral 7B Instruct"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct-v0.1",
      "name": "mistralai/mistral-7b-instruct-v0.1 Mistral: Mistral 7B Instruct v0.1"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct-v0.2",
      "name": "mistralai/mistral-7b-instruct-v0.2 Mistral: Mistral 7B Instruct v0.2"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct-v0.3",
      "name": "mistralai/mistral-7b-instruct-v0.3 Mistral: Mistral 7B Instruct v0.3"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct:free",
      "name": "mistralai/mistral-7b-instruct:free Mistral: Mistral 7B Instruct (free)"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct:nitro",
      "name": "mistralai/mistral-7b-instruct:nitro Mistral: Mistral 7B Instruct (nitro)"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-large",
      "name": "mistralai/mistral-large Mistral Large"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-medium",
      "name": "mistralai/mistral-medium Mistral Medium"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-nemo",
      "name": "mistralai/mistral-nemo Mistral: Mistral Nemo"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-small",
      "name": "mistralai/mistral-small Mistral Small"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-tiny",
      "name": "mistralai/mistral-tiny Mistral Tiny"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x22b",
      "name": "mistralai/mixtral-8x22b Mistral: Mixtral 8x22B (base)"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x22b-instruct",
      "name": "mistralai/mixtral-8x22b-instruct Mistral: Mixtral 8x22B Instruct"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x7b",
      "name": "mistralai/mixtral-8x7b Mixtral 8x7B (base)"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x7b-instruct",
      "name": "mistralai/mixtral-8x7b-instruct Mixtral 8x7B Instruct"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x7b-instruct:nitro",
      "name": "mistralai/mixtral-8x7b-instruct:nitro Mixtral 8x7B Instruct (nitro)"
    },
    {
      "api": "or",
      "id": "neversleep/llama-3-lumimaid-70b",
      "name": "neversleep/llama-3-lumimaid-70b Llama 3 Lumimaid 70B"
    },
    {
      "api": "or",
      "id": "neversleep/llama-3-lumimaid-8b",
      "name": "neversleep/llama-3-lumimaid-8b Llama 3 Lumimaid 8B"
    },
    {
      "api": "or",
      "id": "neversleep/llama-3-lumimaid-8b:extended",
      "name": "neversleep/llama-3-lumimaid-8b:extended Llama 3 Lumimaid 8B (extended)"
    },
    {
      "api": "or",
      "id": "neversleep/noromaid-20b",
      "name": "neversleep/noromaid-20b Noromaid 20B"
    },
    {
      "api": "or",
      "id": "nothingiisreal/mn-celeste-12b",
      "name": "nothingiisreal/mn-celeste-12b Mistral Nemo 12B Celeste"
    },
    {
      "api": "or",
      "id": "nousresearch/hermes-2-pro-llama-3-8b",
      "name": "nousresearch/hermes-2-pro-llama-3-8b NousResearch: Hermes 2 Pro - Llama-3 8B"
    },
    {
      "api": "or",
      "id": "nousresearch/hermes-2-theta-llama-3-8b",
      "name": "nousresearch/hermes-2-theta-llama-3-8b Nous: Hermes 2 Theta 8B"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-capybara-7b",
      "name": "nousresearch/nous-capybara-7b Nous: Capybara 7B"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-capybara-7b:free",
      "name": "nousresearch/nous-capybara-7b:free Nous: Capybara 7B (free)"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-2-mistral-7b-dpo",
      "name": "nousresearch/nous-hermes-2-mistral-7b-dpo Nous: Hermes 2 Mistral 7B DPO"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
      "name": "nousresearch/nous-hermes-2-mixtral-8x7b-dpo Nous: Hermes 2 Mixtral 8x7B DPO"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-2-mixtral-8x7b-sft",
      "name": "nousresearch/nous-hermes-2-mixtral-8x7b-sft Nous: Hermes 2 Mixtral 8x7B SFT"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-llama2-13b",
      "name": "nousresearch/nous-hermes-llama2-13b Nous: Hermes 13B"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-yi-34b",
      "name": "nousresearch/nous-hermes-yi-34b Nous: Hermes 2 Yi 34B"
    },
    {
      "api": "or",
      "id": "open-orca/mistral-7b-openorca",
      "name": "open-orca/mistral-7b-openorca Mistral OpenOrca 7B"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo",
      "name": "openai/gpt-3.5-turbo OpenAI: GPT-3.5 Turbo"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-0125",
      "name": "openai/gpt-3.5-turbo-0125 OpenAI: GPT-3.5 Turbo 16k"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-0301",
      "name": "openai/gpt-3.5-turbo-0301 OpenAI: GPT-3.5 Turbo (older v0301)"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-0613",
      "name": "openai/gpt-3.5-turbo-0613 OpenAI: GPT-3.5 Turbo (older v0613)"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-1106",
      "name": "openai/gpt-3.5-turbo-1106 OpenAI: GPT-3.5 Turbo 16k (older v1106)"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-16k",
      "name": "openai/gpt-3.5-turbo-16k OpenAI: GPT-3.5 Turbo 16k"
    },
    {
      "api": "or",
      "id": "openai/gpt-3.5-turbo-instruct",
      "name": "openai/gpt-3.5-turbo-instruct OpenAI: GPT-3.5 Turbo Instruct"
    },
    {
      "api": "or",
      "id": "openai/gpt-4",
      "name": "openai/gpt-4 OpenAI: GPT-4"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-0314",
      "name": "openai/gpt-4-0314 OpenAI: GPT-4 (older v0314)"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-1106-preview",
      "name": "openai/gpt-4-1106-preview OpenAI: GPT-4 Turbo (older v1106)"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-32k",
      "name": "openai/gpt-4-32k OpenAI: GPT-4 32k"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-32k-0314",
      "name": "openai/gpt-4-32k-0314 OpenAI: GPT-4 32k (older v0314)"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-turbo",
      "name": "openai/gpt-4-turbo OpenAI: GPT-4 Turbo"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-turbo-preview",
      "name": "openai/gpt-4-turbo-preview OpenAI: GPT-4 Turbo Preview"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-vision-preview",
      "name": "openai/gpt-4-vision-preview OpenAI: GPT-4 Vision"
    },
    {
      "api": "or",
      "id": "openai/gpt-4o",
      "name": "openai/gpt-4o OpenAI: GPT-4o"
    },
    {
      "api": "or",
      "id": "openai/gpt-4o-2024-05-13",
      "name": "openai/gpt-4o-2024-05-13 OpenAI: GPT-4o (2024-05-13)"
    },
    {
      "api": "or",
      "id": "openai/gpt-4o-mini",
      "name": "openai/gpt-4o-mini OpenAI: GPT-4o-mini"
    },
    {
      "api": "or",
      "id": "openai/gpt-4o-mini-2024-07-18",
      "name": "openai/gpt-4o-mini-2024-07-18 OpenAI: GPT-4o-mini (2024-07-18)"
    },
    {
      "api": "or",
      "id": "openchat/openchat-7b",
      "name": "openchat/openchat-7b OpenChat 3.5 7B"
    },
    {
      "api": "or",
      "id": "openchat/openchat-7b:free",
      "name": "openchat/openchat-7b:free OpenChat 3.5 7B (free)"
    },
    {
      "api": "or",
      "id": "openchat/openchat-8b",
      "name": "openchat/openchat-8b OpenChat 3.6 8B"
    },
    {
      "api": "or",
      "id": "openrouter/auto",
      "name": "openrouter/auto Auto (best for prompt)"
    },
    {
      "api": "or",
      "id": "openrouter/flavor-of-the-week",
      "name": "openrouter/flavor-of-the-week Flavor of The Week"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3-sonar-large-32k-chat",
      "name": "perplexity/llama-3-sonar-large-32k-chat Perplexity: Llama3 Sonar 70B"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3-sonar-large-32k-online",
      "name": "perplexity/llama-3-sonar-large-32k-online Perplexity: Llama3 Sonar 70B Online"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3-sonar-small-32k-chat",
      "name": "perplexity/llama-3-sonar-small-32k-chat Perplexity: Llama3 Sonar 8B"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3-sonar-small-32k-online",
      "name": "perplexity/llama-3-sonar-small-32k-online Perplexity: Llama3 Sonar 8B Online"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3.1-sonar-large-128k-chat",
      "name": "perplexity/llama-3.1-sonar-large-128k-chat Perplexity: Llama 3.1 Sonar 70B"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3.1-sonar-large-128k-online",
      "name": "perplexity/llama-3.1-sonar-large-128k-online Perplexity: Llama 3.1 Sonar 70B Online"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3.1-sonar-small-128k-chat",
      "name": "perplexity/llama-3.1-sonar-small-128k-chat Perplexity: Llama 3.1 Sonar 8B"
    },
    {
      "api": "or",
      "id": "perplexity/llama-3.1-sonar-small-128k-online",
      "name": "perplexity/llama-3.1-sonar-small-128k-online Perplexity: Llama 3.1 Sonar 8B Online"
    },
    {
      "api": "or",
      "id": "phind/phind-codellama-34b",
      "name": "phind/phind-codellama-34b Phind: CodeLlama 34B v2"
    },
    {
      "api": "or",
      "id": "pygmalionai/mythalion-13b",
      "name": "pygmalionai/mythalion-13b Pygmalion: Mythalion 13B"
    },
    {
      "api": "or",
      "id": "qwen/qwen-110b-chat",
      "name": "qwen/qwen-110b-chat Qwen 1.5 110B Chat"
    },
    {
      "api": "or",
      "id": "qwen/qwen-14b-chat",
      "name": "qwen/qwen-14b-chat Qwen 1.5 14B Chat"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2-72b-instruct",
      "name": "qwen/qwen-2-72b-instruct Qwen 2 72B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2-7b-instruct",
      "name": "qwen/qwen-2-7b-instruct Qwen 2 7B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2-7b-instruct:free",
      "name": "qwen/qwen-2-7b-instruct:free Qwen 2 7B Instruct (free)"
    },
    {
      "api": "or",
      "id": "qwen/qwen-32b-chat",
      "name": "qwen/qwen-32b-chat Qwen 1.5 32B Chat"
    },
    {
      "api": "or",
      "id": "qwen/qwen-4b-chat",
      "name": "qwen/qwen-4b-chat Qwen 1.5 4B Chat"
    },
    {
      "api": "or",
      "id": "qwen/qwen-72b-chat",
      "name": "qwen/qwen-72b-chat Qwen 1.5 72B Chat"
    },
    {
      "api": "or",
      "id": "qwen/qwen-7b-chat",
      "name": "qwen/qwen-7b-chat Qwen 1.5 7B Chat"
    },
    {
      "api": "or",
      "id": "recursal/eagle-7b",
      "name": "recursal/eagle-7b RWKV v5: Eagle 7B"
    },
    {
      "api": "or",
      "id": "recursal/rwkv-5-3b-ai-town",
      "name": "recursal/rwkv-5-3b-ai-town RWKV v5 3B AI Town"
    },
    {
      "api": "or",
      "id": "rwkv/rwkv-5-world-3b",
      "name": "rwkv/rwkv-5-world-3b RWKV v5 World 3B"
    },
    {
      "api": "or",
      "id": "sao10k/fimbulvetr-11b-v2",
      "name": "sao10k/fimbulvetr-11b-v2 Fimbulvetr 11B v2"
    },
    {
      "api": "or",
      "id": "sao10k/l3-euryale-70b",
      "name": "sao10k/l3-euryale-70b Llama 3 Euryale 70B v2.1"
    },
    {
      "api": "or",
      "id": "sao10k/l3-stheno-8b",
      "name": "sao10k/l3-stheno-8b Llama 3 Stheno 8B v3.3 32K"
    },
    {
      "api": "or",
      "id": "snowflake/snowflake-arctic-instruct",
      "name": "snowflake/snowflake-arctic-instruct Snowflake: Arctic Instruct"
    },
    {
      "api": "or",
      "id": "sophosympatheia/midnight-rose-70b",
      "name": "sophosympatheia/midnight-rose-70b Midnight Rose 70B"
    },
    {
      "api": "or",
      "id": "teknium/openhermes-2-mistral-7b",
      "name": "teknium/openhermes-2-mistral-7b OpenHermes 2 Mistral 7B"
    },
    {
      "api": "or",
      "id": "teknium/openhermes-2.5-mistral-7b",
      "name": "teknium/openhermes-2.5-mistral-7b OpenHermes 2.5 Mistral 7B"
    },
    {
      "api": "or",
      "id": "togethercomputer/stripedhyena-hessian-7b",
      "name": "togethercomputer/stripedhyena-hessian-7b StripedHyena Hessian 7B (base)"
    },
    {
      "api": "or",
      "id": "togethercomputer/stripedhyena-nous-7b",
      "name": "togethercomputer/stripedhyena-nous-7b StripedHyena Nous 7B"
    },
    {
      "api": "or",
      "id": "undi95/remm-slerp-l2-13b",
      "name": "undi95/remm-slerp-l2-13b ReMM SLERP 13B"
    },
    {
      "api": "or",
      "id": "undi95/remm-slerp-l2-13b:extended",
      "name": "undi95/remm-slerp-l2-13b:extended ReMM SLERP 13B (extended)"
    },
    {
      "api": "or",
      "id": "undi95/toppy-m-7b",
      "name": "undi95/toppy-m-7b Toppy M 7B"
    },
    {
      "api": "or",
      "id": "undi95/toppy-m-7b:free",
      "name": "undi95/toppy-m-7b:free Toppy M 7B (free)"
    },
    {
      "api": "or",
      "id": "undi95/toppy-m-7b:nitro",
      "name": "undi95/toppy-m-7b:nitro Toppy M 7B (nitro)"
    },
    {
      "api": "or",
      "id": "xwin-lm/xwin-lm-70b",
      "name": "xwin-lm/xwin-lm-70b Xwin 70B"
    }
  ]
}`;
}

const app = new App({target: document.getElementById('app')})
export default app
