import { writable } from 'svelte/store'

let _nextId = 0
export function genTabUniqueIntId() { return _nextId++ }
export function genSessionId() { return Date.now().toString(36) }

let _prevId = null
let _cnt = 0
export function uniqueId() {
  const i = Date.now().toString(36)
  if (_prevId === i) {
    return `${i}_${_cnt++}`
  }
  _prevId = i
  _cnt = 0
  return i
}

/**
  * @param {string} key
  * @returns {[() => void, import('svelte/store').Writable<number>]}
  */
function createCrossTabs(key) {
  const store = writable(0)
  window.addEventListener('storage', (event) => {
    if (event.key === key) {
      store.update(n => n + 1)
    }
  })
  const notify = () => {
    store.update(n => n + 1)
    localStorage.setItem(key, Date.now().toString())
  }
  return [notify, store]
}

export const [notifyDbScripts, subDbScripts] = createCrossTabs('crosstabs_scripts')
export const [notifySessionList, subSessionList] = createCrossTabs('crosstabs_sessionList')
export const [notifyThemeChange, subThemeChange] = createCrossTabs('crosstabs_theme')


export function merge(base, user) {
  if (!user || typeof user !== 'object') return base
    
  if ('$set' in user) {
    if (Array.isArray(user.$set)) {
      const rest = user.$set.findIndex(item => item.$rest !== undefined)
      if (rest === -1) return user.$set
      if (base === undefined) base = []
      return [...user.$set.slice(0, rest), ...base, ...user.$set.slice(rest + 1)]
    }
    const {$rest, ...clean} = user.$set
    return $rest !== undefined ? {...base, ...clean} : user.$set
  }

  const result = Array.isArray(base) ? [...base] : {...base}
  for (const key in user) {
    result[key] = merge(base[key], user[key])
  }
  return result
}

export function escapeRegExp(string) {
  return typeof RegExp.escape === 'function'
    ? RegExp.escape(string)
    : string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor


/**
 * Transforms a relational thread structure into a linear list with depth information.
 * 
 * @param {Array} data - Array of objects, each with id and parentId properties
 * @returns {Array} Ordered list of items with added properties:
 *   - depth: Actual nesting level in the thread hierarchy
 *   - ddepth: Display depth (for UI rendering) which collapses single-reply chains
 *   - lastInChain: True if no replies
 *   - linear: True if the item is part of a single-reply chain
 * 
 * Single-reply chains are flattened in the display depth (ddepth remains the same)
 * while maintaining the logical depth, allowing for more compact thread visualization.
 */
export function relationalToLinear(data) {
  const replies = {null: []}  // {parentId: [item, ...]}
  for (const item of data) {
    (replies[item.parentId] = replies[item.parentId] || []).push(item)
  }

  const out = []

  function _pushItemWithReplies(item, depth, ddepth) {
    const children = replies[item.id] || []
    item.depth = depth
    item.ddepth = ddepth
    item.lastInChain = children.length === 0
    item.linear = children.length === 1
    out.push(item)
    for (const i of children) {
      _pushItemWithReplies(i, depth + 1, item.linear ? ddepth : ddepth + 1)
    }
  }

  for (const item of replies[null]) {
    _pushItemWithReplies(item, 0, 0)
  }

  return out
}

export function omit(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)))
}

export function mergeOpenaiDiff(target, diff) {
  for (const key in diff) {
    if (!Object.prototype.hasOwnProperty.call(diff, key)) continue

    if (diff[key] === null && target[key] !== undefined) continue

    if (target[key] === undefined) {
      target[key] = diff[key]
    } else if (typeof target[key] === 'string' && typeof diff[key] === 'string') {
      if (key === 'arguments' || key === 'content') {
        target[key] += diff[key]
      } else {
        target[key] = diff[key]
      }
    } else if (typeof target[key] === 'object' && target[key] !== null && typeof diff[key] === 'object' && diff[key] !== null && !Array.isArray(target[key]) && !Array.isArray(diff[key])) {
      mergeOpenaiDiff(target[key], diff[key])
    } else {
      target[key] = diff[key]
    }
  }
  return target
}
