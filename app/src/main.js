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
      "baseurl": "anthropic://",
      "token": ""
    },
    "google": {
      "baseurl": "google://",
      "token": ""
    },
    "together": {
      "baseurl": "https://api.together.xyz/v1/",
      "token": ""
    },
    "fireworks": {
      "baseurl": "https://api.fireworks.ai/inference/v1/",
      "token": ""
    },
    "hyperbolic": {
      "baseurl": "https://api.hyperbolic.xyz/v1/",
      "token": ""
    },
    "groq": {
      "baseurl": "https://api.groq.com/openai/v1/",
      "token": ""
    },
    "dummy": {
      "baseurl": "https://api.openai.com/v1/",
      "token": ""
    }
  },
  "models": [
    {
      "api": "fireworks",
      "id": "accounts/fireworks/models/llama-v3p1-405b-instruct",
      "name": "fireworks/llama-v3p1-405b-instruct",
      "max_tokens": 4096
    },
    {
      "api": "together",
      "id": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      "name": "together/Meta-Llama-3.1-405B-Instruct-Turbo",
      "max_tokens": 4096
    },
    {
      "api": "hyperbolic",
      "id": "meta-llama/Meta-Llama-3.1-405B-Instruct",
      "name": "hyperbolic/Meta-Llama-3.1-405B-Instruct",
      "max_tokens": 8192
    },
    {
      "api": "hyperbolic",
      "id": "meta-llama/Meta-Llama-3.1-405B",
      "name": "hyperbolic/Meta-Llama-3.1-405B",
      "max_tokens": 32768,
      "completion": true
    },
    {
      "api": "hyperbolic",
      "id": "meta-llama/Meta-Llama-3.1-405B-FP8",
      "name": "hyperbolic/Meta-Llama-3.1-405B-FP8",
      "max_tokens": 32764,
      "completion": true
    },
    {
      "api": "hyperbolic",
      "id": "NousResearch/Hermes-3-Llama-3.1-70B",
      "name": "hyperbolic/Hermes-3-Llama-3.1-70B",
      "max_tokens": 12288
    },
    {
      "api": "hyperbolic",
      "id": "deepseek-ai/DeepSeek-V2.5",
      "name": "hyperbolic/DeepSeek-V2.5",
      "max_tokens": 8192
    },
    {
      "api": "groq",
      "id": "llama-3.1-8b-instant",
      "name": "groq/llama-3.1-8b-instant",
      "max_tokens": 4096
    },
    {
      "api": "google",
      "id": "gemini-1.5-flash-latest",
      "name": "gemini-1.5-flash-latest",
      "max_tokens": 8192
    },
    {
      "api": "google",
      "id": "gemini-1.5-pro",
      "name": "gemini-1.5-pro",
      "max_tokens": 8192
    },
    {
      "api": "ant",
      "id": "claude-3-5-sonnet-20241022",
      "name": "claude-3-5-sonnet-20241022",
      "max_tokens": 4096,
      "defaultModel": true
    },
    {
      "api": "ant",
      "id": "claude-3-5-sonnet-20240620",
      "name": "claude-3-5-sonnet-20240620",
      "max_tokens": 4096
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
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4o-2024-08-06",
      "name": "gpt-4o-2024-08-06",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "gpt-4o-mini-2024-07-18",
      "name": "gpt-4o-mini-2024-07-18",
      "max_tokens": 128000
    },
    {
      "api": "oai",
      "id": "chatgpt-4o-latest",
      "name": "chatgpt-4o-latest",
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
      "id": "aetherwiing/mn-starcannon-12b",
      "name": "aetherwiing/mn-starcannon-12b Mistral Nemo 12B Starcannon"
    },
    {
      "api": "or",
      "id": "ai21/jamba-1-5-large",
      "name": "ai21/jamba-1-5-large AI21: Jamba 1.5 Large"
    },
    {
      "api": "or",
      "id": "ai21/jamba-1-5-mini",
      "name": "ai21/jamba-1-5-mini AI21: Jamba 1.5 Mini"
    },
    {
      "api": "or",
      "id": "ai21/jamba-instruct",
      "name": "ai21/jamba-instruct AI21: Jamba Instruct"
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
      "id": "anthracite-org/magnum-v2-72b",
      "name": "anthracite-org/magnum-v2-72b Magnum v2 72B"
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
      "id": "cohere/command-r-03-2024",
      "name": "cohere/command-r-03-2024 Cohere: Command R (03-2024)"
    },
    {
      "api": "or",
      "id": "cohere/command-r-08-2024",
      "name": "cohere/command-r-08-2024 Cohere: Command R (08-2024)"
    },
    {
      "api": "or",
      "id": "cohere/command-r-plus",
      "name": "cohere/command-r-plus Cohere: Command R+"
    },
    {
      "api": "or",
      "id": "cohere/command-r-plus-04-2024",
      "name": "cohere/command-r-plus-04-2024 Cohere: Command R+ (04-2024)"
    },
    {
      "api": "or",
      "id": "cohere/command-r-plus-08-2024",
      "name": "cohere/command-r-plus-08-2024 Cohere: Command R+ (08-2024)"
    },
    {
      "api": "or",
      "id": "databricks/dbrx-instruct",
      "name": "databricks/dbrx-instruct Databricks: DBRX 132B Instruct"
    },
    {
      "api": "or",
      "id": "deepseek/deepseek-chat",
      "name": "deepseek/deepseek-chat DeepSeek V2.5"
    },
    {
      "api": "or",
      "id": "eva-unit-01/eva-qwen-2.5-14b",
      "name": "eva-unit-01/eva-qwen-2.5-14b EVA Qwen2.5 14B"
    },
    {
      "api": "or",
      "id": "google/gemini-flash-1.5",
      "name": "google/gemini-flash-1.5 Google: Gemini Flash 1.5"
    },
    {
      "api": "or",
      "id": "google/gemini-flash-1.5-8b",
      "name": "google/gemini-flash-1.5-8b Google: Gemini 1.5 Flash-8B"
    },
    {
      "api": "or",
      "id": "google/gemini-flash-1.5-8b-exp",
      "name": "google/gemini-flash-1.5-8b-exp Google: Gemini Flash 8B 1.5 Experimental"
    },
    {
      "api": "or",
      "id": "google/gemini-flash-1.5-exp",
      "name": "google/gemini-flash-1.5-exp Google: Gemini Flash 1.5 Experimental"
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
      "name": "google/gemini-pro-1.5-exp Google: Gemini Pro 1.5 Experimental"
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
      "id": "gryphe/mythomax-l2-13b:free",
      "name": "gryphe/mythomax-l2-13b:free MythoMax 13B (free)"
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
      "id": "inflection/inflection-3-pi",
      "name": "inflection/inflection-3-pi Inflection: Inflection 3 Pi"
    },
    {
      "api": "or",
      "id": "inflection/inflection-3-productivity",
      "name": "inflection/inflection-3-productivity Inflection: Inflection 3 Productivity"
    },
    {
      "api": "or",
      "id": "jondurbin/airoboros-l2-70b",
      "name": "jondurbin/airoboros-l2-70b Airoboros 70B"
    },
    {
      "api": "or",
      "id": "liquid/lfm-40b",
      "name": "liquid/lfm-40b Liquid: LFM 40B MoE"
    },
    {
      "api": "or",
      "id": "liquid/lfm-40b:free",
      "name": "liquid/lfm-40b:free Liquid: LFM 40B MoE (free)"
    },
    {
      "api": "or",
      "id": "lizpreciatior/lzlv-70b-fp16-hf",
      "name": "lizpreciatior/lzlv-70b-fp16-hf lzlv 70B"
    },
    {
      "api": "or",
      "id": "mancer/weaver",
      "name": "mancer/weaver Mancer: Weaver (alpha)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-2-13b-chat",
      "name": "meta-llama/llama-2-13b-chat Meta: Llama v2 13B Chat"
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
      "id": "meta-llama/llama-3.1-405b-instruct:free",
      "name": "meta-llama/llama-3.1-405b-instruct:free Meta: Llama 3.1 405B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-405b-instruct:nitro",
      "name": "meta-llama/llama-3.1-405b-instruct:nitro Meta: Llama 3.1 405B Instruct (nitro)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-70b-instruct",
      "name": "meta-llama/llama-3.1-70b-instruct Meta: Llama 3.1 70B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-70b-instruct:free",
      "name": "meta-llama/llama-3.1-70b-instruct:free Meta: Llama 3.1 70B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.1-70b-instruct:nitro",
      "name": "meta-llama/llama-3.1-70b-instruct:nitro Meta: Llama 3.1 70B Instruct (nitro)"
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
      "id": "meta-llama/llama-3.2-11b-vision-instruct",
      "name": "meta-llama/llama-3.2-11b-vision-instruct Meta: Llama 3.2 11B Vision Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-11b-vision-instruct:free",
      "name": "meta-llama/llama-3.2-11b-vision-instruct:free Meta: Llama 3.2 11B Vision Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-1b-instruct",
      "name": "meta-llama/llama-3.2-1b-instruct Meta: Llama 3.2 1B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-1b-instruct:free",
      "name": "meta-llama/llama-3.2-1b-instruct:free Meta: Llama 3.2 1B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-3b-instruct",
      "name": "meta-llama/llama-3.2-3b-instruct Meta: Llama 3.2 3B Instruct"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-3b-instruct:free",
      "name": "meta-llama/llama-3.2-3b-instruct:free Meta: Llama 3.2 3B Instruct (free)"
    },
    {
      "api": "or",
      "id": "meta-llama/llama-3.2-90b-vision-instruct",
      "name": "meta-llama/llama-3.2-90b-vision-instruct Meta: Llama 3.2 90B Vision Instruct"
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
      "id": "microsoft/phi-3.5-mini-128k-instruct",
      "name": "microsoft/phi-3.5-mini-128k-instruct Phi-3.5 Mini 128K Instruct"
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
      "id": "mistralai/ministral-3b",
      "name": "mistralai/ministral-3b Ministral 3B"
    },
    {
      "api": "or",
      "id": "mistralai/ministral-8b",
      "name": "mistralai/ministral-8b Ministral 8B"
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
      "id": "mistralai/pixtral-12b",
      "name": "mistralai/pixtral-12b Mistral: Pixtral 12B"
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
      "id": "neversleep/llama-3.1-lumimaid-8b",
      "name": "neversleep/llama-3.1-lumimaid-8b Lumimaid v0.2 8B"
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
      "id": "nousresearch/hermes-3-llama-3.1-405b",
      "name": "nousresearch/hermes-3-llama-3.1-405b Nous: Hermes 3 405B Instruct"
    },
    {
      "api": "or",
      "id": "nousresearch/hermes-3-llama-3.1-405b:extended",
      "name": "nousresearch/hermes-3-llama-3.1-405b:extended Nous: Hermes 3 405B Instruct (extended)"
    },
    {
      "api": "or",
      "id": "nousresearch/hermes-3-llama-3.1-405b:free",
      "name": "nousresearch/hermes-3-llama-3.1-405b:free Nous: Hermes 3 405B Instruct (free)"
    },
    {
      "api": "or",
      "id": "nousresearch/hermes-3-llama-3.1-70b",
      "name": "nousresearch/hermes-3-llama-3.1-70b Nous: Hermes 3 70B Instruct"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
      "name": "nousresearch/nous-hermes-2-mixtral-8x7b-dpo Nous: Hermes 2 Mixtral 8x7B DPO"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-llama2-13b",
      "name": "nousresearch/nous-hermes-llama2-13b Nous: Hermes 13B"
    },
    {
      "api": "or",
      "id": "nvidia/llama-3.1-nemotron-70b-instruct",
      "name": "nvidia/llama-3.1-nemotron-70b-instruct NVIDIA: Llama 3.1 Nemotron 70B Instruct"
    },
    {
      "api": "or",
      "id": "openai/chatgpt-4o-latest",
      "name": "openai/chatgpt-4o-latest OpenAI: ChatGPT-4o"
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
      "id": "openai/gpt-4o-2024-08-06",
      "name": "openai/gpt-4o-2024-08-06 OpenAI: GPT-4o (2024-08-06)"
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
      "id": "openai/gpt-4o:extended",
      "name": "openai/gpt-4o:extended OpenAI: GPT-4o (extended)"
    },
    {
      "api": "or",
      "id": "openai/o1-mini",
      "name": "openai/o1-mini OpenAI: o1-mini"
    },
    {
      "api": "or",
      "id": "openai/o1-mini-2024-09-12",
      "name": "openai/o1-mini-2024-09-12 OpenAI: o1-mini (2024-09-12)"
    },
    {
      "api": "or",
      "id": "openai/o1-preview",
      "name": "openai/o1-preview OpenAI: o1-preview"
    },
    {
      "api": "or",
      "id": "openai/o1-preview-2024-09-12",
      "name": "openai/o1-preview-2024-09-12 OpenAI: o1-preview (2024-09-12)"
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
      "id": "openrouter/auto",
      "name": "openrouter/auto Auto (best for prompt)"
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
      "id": "perplexity/llama-3.1-sonar-huge-128k-online",
      "name": "perplexity/llama-3.1-sonar-huge-128k-online Perplexity: Llama 3.1 Sonar 405B Online"
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
      "id": "qwen/qwen-2-vl-72b-instruct",
      "name": "qwen/qwen-2-vl-72b-instruct Qwen2-VL 72B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2-vl-7b-instruct",
      "name": "qwen/qwen-2-vl-7b-instruct Qwen2-VL 7B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2.5-72b-instruct",
      "name": "qwen/qwen-2.5-72b-instruct Qwen2.5 72B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-2.5-7b-instruct",
      "name": "qwen/qwen-2.5-7b-instruct Qwen2.5 7B Instruct"
    },
    {
      "api": "or",
      "id": "qwen/qwen-72b-chat",
      "name": "qwen/qwen-72b-chat Qwen 1.5 72B Chat"
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
      "id": "sao10k/l3-lunaris-8b",
      "name": "sao10k/l3-lunaris-8b Llama 3 8B Lunaris"
    },
    {
      "api": "or",
      "id": "sao10k/l3.1-euryale-70b",
      "name": "sao10k/l3.1-euryale-70b Llama 3.1 Euryale 70B v2.2"
    },
    {
      "api": "or",
      "id": "sophosympatheia/midnight-rose-70b",
      "name": "sophosympatheia/midnight-rose-70b Midnight Rose 70B"
    },
    {
      "api": "or",
      "id": "teknium/openhermes-2.5-mistral-7b",
      "name": "teknium/openhermes-2.5-mistral-7b OpenHermes 2.5 Mistral 7B"
    },
    {
      "api": "or",
      "id": "thedrummer/rocinante-12b",
      "name": "thedrummer/rocinante-12b Rocinante 12B"
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
      "id": "x-ai/grok-beta",
      "name": "x-ai/grok-beta xAI: Grok Beta"
    },
    {
      "api": "or",
      "id": "xwin-lm/xwin-lm-70b",
      "name": "xwin-lm/xwin-lm-70b Xwin 70B"
    },
    {
      "api": "dummy",
      "id": "dummy",
      "name": "dummy"
    }
  ]
}`;
}

const app = new App({target: document.getElementById('app')})
export default app
