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
