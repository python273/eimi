import { writable } from 'svelte/store'

const KEY = 'cfg-favorite-models'
const DEFAULT_FAVORITES = [
  {
    "api": "openai",
    "id": "gpt-4o-2024-11-20",
    "name": "gpt-4o-2024-11-20"
  },
  {
    "api": "anthropic",
    "id": "claude-3-7-sonnet-20250219",
    "name": "Claude 3.7 Sonnet"
  }
]

const isSameModel = (a, b) => a.api === b.api && a.id === b.id

function getFavoriteModels() {
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : DEFAULT_FAVORITES
  } catch (error) {
    console.error('Error loading favorite models:', error)
    return DEFAULT_FAVORITES
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
    }
  }
}

export const favoriteModels = createFavoriteModelsStore()