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
    return [notify, store.subscribe]
}

export const [notifyDbScripts, subDbScripts] = createCrossTabs('crosstabs_scripts')
export const [notifySessionList, subSessionList] = createCrossTabs('crosstabs_sessionList')


export function merge(base, user) {
    if (!user || typeof user !== 'object') return base
    
    if ('$set' in user) {
        if (Array.isArray(user.$set)) {
            const rest = user.$set.findIndex(item => item.$rest !== undefined)
            if (rest === -1) return user.$set
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
