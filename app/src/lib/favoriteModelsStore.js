import { writable } from 'svelte/store'

const KEY = 'cfg-favorite-models'

export const API_DEFAULT_FAVORITES = {
  openai: [{
    "api": "openai",
    "id": "gpt-4o-2024-11-20",
    "name": "gpt-4o-2024-11-20"
  }],
  anthropic: [{
    "api": "anthropic",
    "id": "claude-3-7-sonnet-20250219",
    "name": "Claude 3.7 Sonnet"
  }],
  openrouter: [{
    "api": "openrouter",
    "id": "deepseek/deepseek-chat-v3-0324",
    "name": "deepseek/deepseek-chat-v3-0324 DeepSeek: DeepSeek V3 0324",
  }],
  google: [{
    "api": "google",
    "id": "gemini-2.5-pro-exp-03-25",
    "name": "gemini-2.5-pro-exp-03-25",
  }, {
    "api": "google",
    "id": "gemini-2.5-pro-preview-03-25",
    "name": "gemini-2.5-pro-preview-03-25",
  }],
  deepseek: [ {
    "api": "deepseek",
    "id": "deepseek-chat",
    "name": "deepseek-chat",
  }, {
    "api": "deepseek",
    "id": "deepseek-reasoner",
    "name": "deepseek-reasoner",
  }],
}

const isSameModel = (a, b) => a.api === b.api && a.id === b.id

function getFavoriteModels() {
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading favorite models:', error)
    return []
  }
}

function createFavoriteModelsStore() {
  const { subscribe, set, update } = writable(getFavoriteModels())

  subscribe(favorites => {
    localStorage.setItem(KEY, JSON.stringify(favorites))
  })

  window.addEventListener('storage', (event) => {
    if (event.key === KEY) set(getFavoriteModels())
  })

  return {
    subscribe,
    set,
    toggle: (model) => {
      update(favorites => {
        const exists = favorites.some(f => isSameModel(f, model))
        return exists 
          ? favorites.filter(f => !isSameModel(f, model))
          : [...favorites, model]
      })
    },
    reorder: (fromIndex, toIndex) => {
      update(favorites => {
        const newFavorites = [...favorites]
        const [removed] = newFavorites.splice(fromIndex, 1)
        newFavorites.splice(toIndex, 0, removed)
        return newFavorites
      })
    }
  }
}

export const favoriteModels = createFavoriteModelsStore()
