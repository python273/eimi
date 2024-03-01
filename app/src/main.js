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
    }
  },
  "models": [
    {
      "api": "oai",
      "id": "gpt-3.5-turbo",
      "name": "gpt-3.5-turbo"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-16k",
      "name": "gpt-3.5-turbo-16k"
    },
    {
      "api": "oai",
      "id": "gpt-4",
      "name": "gpt-4"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-instruct",
      "name": "gpt-3.5-turbo-instruct"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-0301",
      "name": "gpt-3.5-turbo-0301"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-0613",
      "name": "gpt-3.5-turbo-0613"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-16k-0613",
      "name": "gpt-3.5-turbo-16k-0613"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-1106",
      "name": "gpt-3.5-turbo-1106"
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-0125",
      "name": "gpt-3.5-turbo-0125"
    },
    {
      "api": "oai",
      "id": "gpt-4-0314",
      "name": "gpt-4-0314"
    },
    {
      "api": "oai",
      "id": "gpt-4-0613",
      "name": "gpt-4-0613"
    },
    {
      "api": "oai",
      "id": "gpt-4-32k-0613",
      "name": "gpt-4-32k-0613"
    },
    {
      "api": "oai",
      "id": "gpt-4-1106-preview",
      "name": "gpt-4-1106-preview"
    },
    {
      "api": "oai",
      "id": "gpt-4-0125-preview",
      "name": "gpt-4-0125-preview",
      "defaultModel": true
    },
    {
      "api": "oai",
      "id": "gpt-3.5-turbo-instruct-0914",
      "name": "gpt-3.5-turbo-instruct-0914"
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
      "id": "alpindale/goliath-120b",
      "name": "alpindale/goliath-120b Goliath 120B"
    },
    {
      "api": "or",
      "id": "anthropic/claude-1",
      "name": "anthropic/claude-1 Anthropic: Claude v1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-1.2",
      "name": "anthropic/claude-1.2 Anthropic: Claude (older v1)"
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
      "name": "anthropic/claude-2.0:beta Anthropic: Claude v2.0 (experimental)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.1",
      "name": "anthropic/claude-2.1 Anthropic: Claude v2.1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2.1:beta",
      "name": "anthropic/claude-2.1:beta Anthropic: Claude v2.1 (experimental)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-2:beta",
      "name": "anthropic/claude-2:beta Anthropic: Claude v2 (experimental)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1",
      "name": "anthropic/claude-instant-1 Anthropic: Claude Instant v1"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1.0",
      "name": "anthropic/claude-instant-1.0 Anthropic: Claude Instant (older v1)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1.1",
      "name": "anthropic/claude-instant-1.1 Anthropic: Claude Instant (older v1.1)"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1.2",
      "name": "anthropic/claude-instant-1.2 Anthropic: Claude Instant v1.2"
    },
    {
      "api": "or",
      "id": "anthropic/claude-instant-1:beta",
      "name": "anthropic/claude-instant-1:beta Anthropic: Claude Instant v1 (experimental)"
    },
    {
      "api": "or",
      "id": "austism/chronos-hermes-13b",
      "name": "austism/chronos-hermes-13b Chronos Hermes 13B v2"
    },
    {
      "api": "or",
      "id": "codellama/codellama-70b-instruct",
      "name": "codellama/codellama-70b-instruct Meta: CodeLlama 70B Instruct"
    },
    {
      "api": "or",
      "id": "cognitivecomputations/dolphin-mixtral-8x7b",
      "name": "cognitivecomputations/dolphin-mixtral-8x7b Dolphin 2.6 Mixtral 8x7B \ud83d\udc2c"
    },
    {
      "api": "or",
      "id": "google/gemini-pro",
      "name": "google/gemini-pro Google: Gemini Pro (preview)"
    },
    {
      "api": "or",
      "id": "google/gemini-pro-vision",
      "name": "google/gemini-pro-vision Google: Gemini Pro Vision (preview)"
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
      "id": "gryphe/mythomax-l2-13b-8k",
      "name": "gryphe/mythomax-l2-13b-8k MythoMax 13B 8k"
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
      "id": "haotian-liu/llava-13b",
      "name": "haotian-liu/llava-13b Llava 13B"
    },
    {
      "api": "or",
      "id": "huggingfaceh4/zephyr-7b-beta",
      "name": "huggingfaceh4/zephyr-7b-beta Hugging Face: Zephyr 7B"
    },
    {
      "api": "or",
      "id": "huggingfaceh4/zephyr-7b-beta:free",
      "name": "huggingfaceh4/zephyr-7b-beta:free Hugging Face: Zephyr 7B (free)"
    },
    {
      "api": "or",
      "id": "intel/neural-chat-7b",
      "name": "intel/neural-chat-7b Neural Chat 7B v3.1"
    },
    {
      "api": "or",
      "id": "jebcarter/psyfighter-13b",
      "name": "jebcarter/psyfighter-13b Psyfighter 13B"
    },
    {
      "api": "or",
      "id": "jondurbin/airoboros-l2-70b",
      "name": "jondurbin/airoboros-l2-70b Airoboros 70B"
    },
    {
      "api": "or",
      "id": "jondurbin/bagel-34b",
      "name": "jondurbin/bagel-34b Bagel 34B v0.2"
    },
    {
      "api": "or",
      "id": "koboldai/psyfighter-13b-2",
      "name": "koboldai/psyfighter-13b-2 Psyfighter v2 13B"
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
      "id": "meta-llama/codellama-34b-instruct",
      "name": "meta-llama/codellama-34b-instruct Meta: CodeLlama 34B Instruct"
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
      "id": "migtissera/synthia-70b",
      "name": "migtissera/synthia-70b Synthia 70B"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct",
      "name": "mistralai/mistral-7b-instruct Mistral 7B Instruct"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-7b-instruct:free",
      "name": "mistralai/mistral-7b-instruct:free Mistral 7B Instruct (free)"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-large",
      "name": "mistralai/mistral-large Mistral: Mistral Large"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-medium",
      "name": "mistralai/mistral-medium Mistral: Mistral Medium"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-small",
      "name": "mistralai/mistral-small Mistral: Mistral Small"
    },
    {
      "api": "or",
      "id": "mistralai/mistral-tiny",
      "name": "mistralai/mistral-tiny Mistral: Mistral Tiny"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x7b",
      "name": "mistralai/mixtral-8x7b Mistral: Mixtral 8x7B (base)"
    },
    {
      "api": "or",
      "id": "mistralai/mixtral-8x7b-instruct",
      "name": "mistralai/mixtral-8x7b-instruct Mistral: Mixtral 8x7B Instruct"
    },
    {
      "api": "or",
      "id": "neversleep/noromaid-20b",
      "name": "neversleep/noromaid-20b Noromaid 20B"
    },
    {
      "api": "or",
      "id": "neversleep/noromaid-mixtral-8x7b-instruct",
      "name": "neversleep/noromaid-mixtral-8x7b-instruct Noromaid Mixtral 8x7B Instruct"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-capybara-34b",
      "name": "nousresearch/nous-capybara-34b Nous: Capybara 34B"
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
      "id": "nousresearch/nous-hermes-2-vision-7b",
      "name": "nousresearch/nous-hermes-2-vision-7b Nous: Hermes 2 Vision 7B (alpha)"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-llama2-13b",
      "name": "nousresearch/nous-hermes-llama2-13b Nous: Hermes 13B"
    },
    {
      "api": "or",
      "id": "nousresearch/nous-hermes-llama2-70b",
      "name": "nousresearch/nous-hermes-llama2-70b Nous: Hermes 70B"
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
      "id": "openai/gpt-4-turbo-preview",
      "name": "openai/gpt-4-turbo-preview OpenAI: GPT-4 Turbo (preview)"
    },
    {
      "api": "or",
      "id": "openai/gpt-4-vision-preview",
      "name": "openai/gpt-4-vision-preview OpenAI: GPT-4 Vision (preview)"
    },
    {
      "api": "or",
      "id": "openchat/openchat-7b",
      "name": "openchat/openchat-7b OpenChat 3.5"
    },
    {
      "api": "or",
      "id": "openchat/openchat-7b:free",
      "name": "openchat/openchat-7b:free OpenChat 3.5 (free)"
    },
    {
      "api": "or",
      "id": "openrouter/auto",
      "name": "openrouter/auto Auto (best for prompt)"
    },
    {
      "api": "or",
      "id": "openrouter/cinematika-7b",
      "name": "openrouter/cinematika-7b Cinematika 7B (alpha)"
    },
    {
      "api": "or",
      "id": "openrouter/cinematika-7b:free",
      "name": "openrouter/cinematika-7b:free Cinematika 7B (alpha) (free)"
    },
    {
      "api": "or",
      "id": "perplexity/pplx-70b-chat",
      "name": "perplexity/pplx-70b-chat Perplexity: PPLX 70B Chat"
    },
    {
      "api": "or",
      "id": "perplexity/pplx-70b-online",
      "name": "perplexity/pplx-70b-online Perplexity: PPLX 70B Online"
    },
    {
      "api": "or",
      "id": "perplexity/pplx-7b-chat",
      "name": "perplexity/pplx-7b-chat Perplexity: PPLX 7B Chat"
    },
    {
      "api": "or",
      "id": "perplexity/pplx-7b-online",
      "name": "perplexity/pplx-7b-online Perplexity: PPLX 7B Online"
    },
    {
      "api": "or",
      "id": "perplexity/sonar-medium-chat",
      "name": "perplexity/sonar-medium-chat Perplexity: Sonar 8x7B"
    },
    {
      "api": "or",
      "id": "perplexity/sonar-medium-online",
      "name": "perplexity/sonar-medium-online Perplexity: Sonar 8x7B Online"
    },
    {
      "api": "or",
      "id": "perplexity/sonar-small-chat",
      "name": "perplexity/sonar-small-chat Perplexity: Sonar 7B"
    },
    {
      "api": "or",
      "id": "perplexity/sonar-small-online",
      "name": "perplexity/sonar-small-online Perplexity: Sonar 7B Online"
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
      "id": "undi95/remm-slerp-l2-13b-6k",
      "name": "undi95/remm-slerp-l2-13b-6k ReMM SLERP 13B 6k"
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
      "id": "xwin-lm/xwin-lm-70b",
      "name": "xwin-lm/xwin-lm-70b Xwin 70B"
    }
  ]
}`;
}

const app = new App({
  target: document.getElementById('app'),
})

export default app
