import { writable } from 'svelte/store'

const THEME_KEY = 'cfg-theme'
const THEME_OPTIONS = ['system', 'light', 'dark']

const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const storedTheme = localStorage.getItem(THEME_KEY) || 'system'

function getIsDark(theme) {
  let isDark = theme === 'dark'
  if (theme === 'system') {
    isDark = prefersDarkQuery.matches
  }
  return isDark
}

const { subscribe, set, update } = writable({
  theme: storedTheme,
  isDark: getIsDark(storedTheme)
})

const store = {
  subscribe,
  set: (theme) => {
    set({theme, isDark: getIsDark(theme)})
  },
  toggle: () => {
    update(state => {
      const currentIdx = THEME_OPTIONS.indexOf(state.theme)
      const nextTheme = THEME_OPTIONS[(currentIdx + 1) % THEME_OPTIONS.length]
      return {
        theme: nextTheme,
        isDark: getIsDark(nextTheme)
      }
    })
  },
  options: THEME_OPTIONS
}

prefersDarkQuery.addEventListener('change', () => {
  update(state => ({
    ...state,
    isDark: getIsDark(state.theme)
  }))
})

subscribe(state => {
  localStorage.setItem(THEME_KEY, state.theme)
})

window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY) {
    store.set(event.newValue)
  }
})

export const themeStore = store
