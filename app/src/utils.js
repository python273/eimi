import { writable } from 'svelte/store';

let _nextId = 0
export function genTabUniqueIntId() { return _nextId++ }
export function genSessionId() { return Date.now().toString(36) }

let _prevId = null;
let _cnt = 0;
export function uniqueId() {
    let i = Date.now().toString(36);
    if (_prevId === i) {
        return `${i}_${_cnt++}`;
    }
    _prevId = i;
    _cnt = 0;
    return i;
}

const dbScriptsUpdate = writable(0);
export const notifyDbScripts = () => { dbScriptsUpdate.update(n => n + 1); };
export const subDbScripts = dbScriptsUpdate.subscribe;

export function merge(base, user) {
    if (!user || typeof user !== 'object') return base;
    
    if ('$set' in user) {
        if (Array.isArray(user.$set)) {
            const rest = user.$set.findIndex(item => item.$rest !== undefined);
            if (rest === -1) return user.$set;
            return [...user.$set.slice(0, rest), ...base, ...user.$set.slice(rest + 1)];
        }
        const {$rest, ...clean} = user.$set;
        return $rest !== undefined ? {...base, ...clean} : user.$set;
    }

    const result = Array.isArray(base) ? [...base] : {...base};
    for (const key in user) {
        result[key] = merge(base[key], user[key]);
    }
    return result;
}

export function escapeRegExp(string) {
    return typeof RegExp.escape === 'function'
        ? RegExp.escape(string)
        : string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
