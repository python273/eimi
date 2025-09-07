import './global.css'
import App from './App.svelte'
import { refreshConfig } from './config.svelte'
import { mount } from "svelte"

window.addEventListener('unload', function() {})
window.addEventListener('beforeunload', function() {})


if (localStorage.getItem('cfg-config-user') === null) {
  const userConfig = {
    "apis": {
      "openai": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "anthropic": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "openrouter": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "google": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "hyperbolic": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "xai": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "together": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "fireworks": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "groq": {"$set": {"token": "", "proxy": true, "$rest": 1}},
      "deepseek": {"$set": {"token": "", "proxy": true, "$rest": 1}},
    },
    "models": {"$set": [
      {"$rest": 1}
    ]}
  }
  const oldApiNameMap = {oai: 'openai', or: 'openrouter', ant: 'anthropic'}
  const prevConfig = JSON.parse(localStorage.getItem('cfg-config') || '{}')
  if (prevConfig?.apis) {
    Object.keys(prevConfig.apis).forEach(oldApi => {
      const newApi = oldApiNameMap[oldApi] || oldApi
      if (userConfig.apis[newApi] && prevConfig.apis[oldApi]?.token) {
        userConfig.apis[newApi].$set.token = prevConfig.apis[oldApi].token
      }
    })
  }

  localStorage['cfg-config-user'] = JSON.stringify(userConfig, undefined, 2)
  localStorage.removeItem('cfg-config')
  refreshConfig()
}

const app = mount(App, {target: document.getElementById('app')})

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
  })
}

export default app
