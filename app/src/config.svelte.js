import DEFAULT_CONFIG from "./default_config.json"
import { merge } from "./utils"

export const configUpdated = $state({i: 0})

export function refreshConfig() {
  try {
    CONFIG = merge(DEFAULT_CONFIG, JSON.parse(localStorage['cfg-config-user'] || "{}"))
  } catch (error) {
    console.error('User config is not valid', error)
    alert('User config is not valid')
    CONFIG = DEFAULT_CONFIG
  }
  window._config = CONFIG
  configUpdated.i += 1
}

export let CONFIG
refreshConfig()
