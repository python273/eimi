import { uniqueId } from '../utils.js'

const PANEL_GAP = 8
const MIN_PANEL_SIZE = 96

function forceNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function makeEmptyLeaf(id, layoutKey = undefined) {
  return layoutKey ? { type: 'empty', id, layoutKey } : { type: 'empty', id }
}

function makeWindowLeaf(id, layoutKey = undefined) {
  return layoutKey ? { type: 'window', id, layoutKey } : { type: 'window', id }
}

function cloneValue(value) {
  if (value === undefined) return undefined
  const plainValue = typeof value === 'object' && value !== null
    ? $state.snapshot(value)
    : value
  return structuredClone(plainValue)
}

function normalizeLeaf(node, state) {
  if (!node || typeof node !== 'object') {
    return makeEmptyLeaf(state.createEmptyId())
  }
  if (node.type === 'window') {
    return typeof node.id === 'string'
      ? makeWindowLeaf(node.id, node.layoutKey)
      : makeEmptyLeaf(state.createEmptyId())
  }
  if (node.type === 'empty') {
    return typeof node.id === 'string'
      ? makeEmptyLeaf(node.id, node.layoutKey)
      : makeEmptyLeaf(state.createEmptyId())
  }
  return makeEmptyLeaf(state.createEmptyId())
}

function normalizeChild(child, state) {
  const base = child && typeof child === 'object' ? child : {}
  const size = Number.isFinite(base.size) ? base.size : undefined
  const grow = Number.isFinite(base.grow) ? base.grow : undefined
  const ratio = Number.isFinite(base.ratio) ? base.ratio : undefined
  const node = base.node !== undefined
    ? normalizeLayoutNode(base.node, state)
    : normalizeLayoutNode(base, state)
  return { node, size, grow, ratio }
}

function normalizeLayoutNode(node, state) {
  if (node?.type === 'split') {
    const children = Array.isArray(node.children) ? node.children.map((child) => normalizeChild(child, state)) : []
    return {
      type: 'split',
      direction: node.direction === 'column' ? 'column' : 'row',
      children: children.length ? children : [{ node: makeEmptyLeaf(state.createEmptyId()), grow: 1 }],
    }
  }
  return normalizeLeaf(node, state)
}

function resolveChildSizes(split, totalSize) {
  const count = split.children.length
  if (!count) return []
  const innerSize = Math.max(0, totalSize - Math.max(0, count - 1) * PANEL_GAP)
  const hasRatios = split.children.some((child) => Number.isFinite(child.ratio))
  if (hasRatios) {
    let used = 0
    return split.children.map((child, index) => {
      if (index === count - 1) return Math.max(0, innerSize - used)
      const nextSize = Math.max(0, Math.round(innerSize * forceNumber(child.ratio, 0)))
      used += nextSize
      return nextSize
    })
  }

  const fixed = split.children.reduce((sum, child) => sum + forceNumber(child.size, 0), 0)
  const growChildren = split.children.map((child) => {
    if (Number.isFinite(child.size)) return 0
    return forceNumber(child.grow, 1)
  })
  const totalGrow = growChildren.reduce((sum, value) => sum + value, 0)
  const remaining = Math.max(0, innerSize - fixed)

  let used = 0
  return split.children.map((child, index) => {
    if (Number.isFinite(child.size)) {
      used += child.size
      return child.size
    }
    if (index === count - 1) {
      return Math.max(0, innerSize - used)
    }
    const grow = growChildren[index]
    const nextSize = totalGrow > 0 ? Math.max(0, Math.round((remaining * grow) / totalGrow)) : 0
    used += nextSize
    return nextSize
  })
}

function findLeaf(node, targetId, trail = []) {
  if (!node) return null
  if (node.type === 'split') {
    for (let index = 0; index < node.children.length; index += 1) {
      const match = findLeaf(node.children[index].node, targetId, [...trail, index])
      if (match) return match
    }
    return null
  }
  return node.id === targetId ? { node, trail } : null
}

function getNodeAtTrail(root, trail) {
  let current = root
  for (const index of trail) {
    if (!current || current.type !== 'split') return null
    current = current.children[index]?.node
  }
  return current
}

function dedupeEmptyIds(node, state, seen = Object.create(null)) {
  if (!node || typeof node !== 'object') return false
  let changed = false
  if (node.type === 'split') {
    for (const child of node.children || []) {
      if (dedupeEmptyIds(child.node, state, seen)) changed = true
    }
    return changed
  }
  if (node.type === 'empty') {
    if (!node.id || seen[node.id]) {
      node.id = state.createEmptyId()
      changed = true
    }
    seen[node.id] = true
  }
  return changed
}

function leafIdFromWindow(windowRecord) {
  if (!windowRecord) return null
  return windowRecord.dockTargetId || (windowRecord.declared ? windowRecord.id : null)
}

function getWindowRestoreKey(windowRecord) {
  if (!windowRecord) return null
  return windowRecord.declared ? windowRecord.id : (windowRecord.layoutKey || windowRecord.title || null)
}

function getWindowSlotKey(windowRecord) {
  if (!windowRecord || windowRecord.declared) return null
  return windowRecord.layoutKey || windowRecord.title || null
}

export class WindowSystemState {
  version = $state(0)
  layout = $state(null)
  windows = $state({})
  floatingWindows = $state({})
  zCounter = 20
  componentInstances = {}
  measurements = {
    frame: { left: 0, top: 0, width: 0, height: 0 },
    windowRects: {},
    slotRects: {},
  }
  constructor({ layout }) {
    this.initialLayout = layout
    this.layout = normalizeLayoutNode(layout, this)
    dedupeEmptyIds(this.layout, this)
  }

  bump() {
    this.version += 1
  }

  createEmptyId() {
    return `empty-${uniqueId()}`
  }

  resolveId(id) {
    return id
  }

  assertPageModeAllowed(id, mode) {
    if (mode !== 'page') return
    const otherPage = Object.values(this.windows).find((windowRecord) => windowRecord.mode === 'page' && windowRecord.id !== id)
    if (otherPage) {
      throw new Error(`Only one page-mode window is allowed. Already registered: ${otherPage.id}`)
    }
  }

  setLeafLayoutKey(targetId, layoutKey) {
    const found = findLeaf(this.layout, targetId)
    if (!found) return false
    if (layoutKey) {
      found.node.layoutKey = layoutKey
    } else {
      delete found.node.layoutKey
    }
    return true
  }

  clearLeafLayoutKeys(layoutKey, exceptTargetId = null, node = this.layout) {
    if (!layoutKey || !node) return false
    if (node.type === 'split') {
      let changed = false
      for (const child of node.children) {
        if (this.clearLeafLayoutKeys(layoutKey, exceptTargetId, child.node)) changed = true
      }
      return changed
    }
    if (node.id !== exceptTargetId && node.layoutKey === layoutKey) {
      delete node.layoutKey
      return true
    }
    return false
  }

  isLeafOccupied(targetId, ignoreWindowId = null) {
    return Object.values(this.windows).some((windowRecord) => (
      windowRecord.id !== ignoreWindowId
      && !windowRecord.floating
      && leafIdFromWindow(windowRecord) === targetId
    ))
  }

  findReclaimableSlot(layoutKey, ignoreWindowId = null, node = this.layout) {
    if (!layoutKey || !node) return null
    if (node.type === 'split') {
      for (const child of node.children) {
        const found = this.findReclaimableSlot(layoutKey, ignoreWindowId, child.node)
        if (found) return found
      }
      return null
    }
    if (node.layoutKey === layoutKey && !this.isLeafOccupied(node.id, ignoreWindowId)) {
      return node.id
    }
    return null
  }

  applySavedPlacement(windowRecord) {
    const restoreKey = getWindowRestoreKey(windowRecord)
    const floating = restoreKey ? this.floatingWindows[restoreKey] : null

    if (floating && windowRecord.mode !== 'page' && windowRecord.floatable !== false) {
      windowRecord.floating = true
      windowRecord.dockTargetId = null
      for (const key of ['left', 'top', 'width', 'height']) {
        if (floating[key] !== undefined) windowRecord[key] = floating[key]
      }
      return
    }

    if (!windowRecord.declared) {
      const slotId = this.findReclaimableSlot(getWindowSlotKey(windowRecord), windowRecord.id)
      if (slotId) {
        windowRecord.floating = false
        windowRecord.dockTargetId = slotId
      }
    } else if (findLeaf(this.layout, windowRecord.id)) {
      windowRecord.floating = false
      windowRecord.dockTargetId = windowRecord.id
    }
  }

  syncWindowPersistence(windowRecord, previousRestoreKey = null) {
    const restoreKey = getWindowRestoreKey(windowRecord)
    if (previousRestoreKey && previousRestoreKey !== restoreKey) {
      delete this.floatingWindows[previousRestoreKey]
      this.clearLeafLayoutKeys(previousRestoreKey)
    }

    if (windowRecord.floating) {
      if (!restoreKey) return
      this.floatingWindows[restoreKey] = {
        left: forceNumber(windowRecord.left, 48),
        top: forceNumber(windowRecord.top, 48),
        width: forceNumber(windowRecord.width, 512),
        height: forceNumber(windowRecord.height, 360),
      }
      return
    }

    this.clearLeafLayoutKeys(getWindowSlotKey(windowRecord), leafIdFromWindow(windowRecord))
    if (restoreKey) delete this.floatingWindows[restoreKey]
    this.setLeafLayoutKey(leafIdFromWindow(windowRecord), getWindowSlotKey(windowRecord))
  }

  registerWindow(windowDef) {
    const id = this.resolveId(windowDef.name || windowDef.id)
    if (!id) throw new Error('Window name is required')
    this.assertPageModeAllowed(id, windowDef.mode)

    const current = this.windows[id] || {}
    this.windows[id] = {
      title: '',
      mode: 'panel',
      className: '',
      bodyClass: '',
      buttons: [],
      closable: false,
      floatable: false,
      unstyled: false,
      floating: false,
      render: null,
      left: 48,
      top: 48,
      width: 512,
      height: 360,
      ...current,
      ...windowDef,
    }
    this.windows[id].id = id
    this.windows[id].declared = true
    this.applySavedPlacement(this.windows[id])
    this.bump()
    return id
  }

  unregisterWindow(id) {
    const resolvedId = this.resolveId(id)
    const windowRecord = this.windows[resolvedId]
    if (!windowRecord) return
    this.syncWindowPersistence(windowRecord)
    delete this.windows[resolvedId]
    delete this.componentInstances[resolvedId]
    this.bump()
  }

  addWindow(windowDef) {
    const id = this.resolveId(windowDef.id || `window-${uniqueId()}`)
    this.assertPageModeAllowed(id, windowDef.mode)
    const count = Object.keys(this.windows).length
    const fallbackTitle = windowDef.title || windowDef.layoutKey || ''
    const windowRecord = {
      title: fallbackTitle,
      mode: 'panel',
      className: '',
      bodyClass: '',
      buttons: [],
      closable: true,
      floatable: true,
      unstyled: false,
      floating: true,
      left: 48 + (count % 6) * 20,
      top: 48 + (count % 6) * 20,
      width: 512,
      height: 360,
      zIndex: ++this.zCounter,
      data: {},
      ...windowDef,
    }
    windowRecord.id = id
    windowRecord.declared = false
    windowRecord.title = windowRecord.title || windowRecord.layoutKey || ''

    if (windowRecord.mode === 'page') {
      windowRecord.floating = false
      windowRecord.floatable = false
      windowRecord.closable = false
    }

    this.applySavedPlacement(windowRecord)
    if (windowRecord.dockTargetId && findLeaf(this.layout, windowRecord.dockTargetId)) {
      windowRecord.floating = false
    }
    this.windows[id] = windowRecord
    this.syncWindowPersistence(windowRecord)
    this.bump()
    return id
  }

  createEmptyWindow(options = {}) {
    const mountEl = document.createElement('div')
    mountEl.style.width = '100%'
    mountEl.style.height = '100%'
    mountEl.style.display = 'contents'

    return this.addWindow({
      ...options,
      mountEl,
      onReady: options.onReady,
      onWindowClose: options.onWindowClose,
    })
  }

  updateWindow(id, patch) {
    const resolvedId = this.resolveId(id)
    const windowRecord = this.windows[resolvedId]
    if (!windowRecord) return false
    this.assertPageModeAllowed(resolvedId, patch.mode ?? windowRecord.mode)
    const previousRestoreKey = getWindowRestoreKey(windowRecord)

    let changed = false
    for (const [key, value] of Object.entries(patch)) {
      if (!Object.is(windowRecord[key], value)) {
        changed = true
        break
      }
    }
    if (!changed) return false

    Object.assign(windowRecord, patch)
    if (windowRecord.mode === 'page') {
      windowRecord.floating = false
      windowRecord.floatable = false
      windowRecord.closable = false
    }
    this.syncWindowPersistence(windowRecord, previousRestoreKey)
    this.bump()
    return true
  }

  setComponentInstance(id, instance) {
    const resolvedId = this.resolveId(id)
    if (instance) {
      this.componentInstances[resolvedId] = instance
    } else {
      delete this.componentInstances[resolvedId]
    }
  }

  callButton(id, button, event) {
    const instance = this.componentInstances[this.resolveId(id)]
    const methodName = button?.methodName
    if (!instance || !methodName || typeof instance[methodName] !== 'function') return
    return instance[methodName](event)
  }

  focusWindow(id) {
    const windowRecord = this.windows[this.resolveId(id)]
    if (!windowRecord || !windowRecord.floating) return
    windowRecord.zIndex = ++this.zCounter
    this.bump()
  }

  closeWindow(id) {
    const resolvedId = this.resolveId(id)
    const windowRecord = this.windows[resolvedId]
    if (!windowRecord) return false
    this.syncWindowPersistence(windowRecord)
    try {
      windowRecord.onWindowClose?.()
    } catch (error) {
      console.error(error)
    }
    delete this.windows[resolvedId]
    delete this.componentInstances[resolvedId]
    this.bump()
    return true
  }

  getLeafTargetId(targetId) {
    const resolvedTargetId = this.resolveId(targetId)
    if (findLeaf(this.layout, resolvedTargetId)) return resolvedTargetId
    const targetWindow = this.windows[resolvedTargetId]
    if (targetWindow && !targetWindow.floating && targetWindow.dockTargetId && findLeaf(this.layout, targetWindow.dockTargetId)) {
      return targetWindow.dockTargetId
    }
    return null
  }

  replaceLeaf(targetId, replacement) {
    const resolvedTargetId = this.resolveId(targetId)
    const found = findLeaf(this.layout, resolvedTargetId)
    if (!found) return false
    if (found.trail.length === 0) {
      this.layout = replacement
      return true
    }

    let current = this.layout
    for (let index = 0; index < found.trail.length - 1; index += 1) {
      current = current.children[found.trail[index]].node
    }
    current.children[found.trail.at(-1)].node = replacement
    return true
  }

  closeSlot(targetId) {
    const resolvedTargetId = this.resolveId(targetId)
    const found = findLeaf(this.layout, resolvedTargetId)
    if (!found || found.trail.length === 0) return false

    const parentTrail = found.trail.slice(0, -1)
    const childIndex = found.trail.at(-1)
    const parentNode = getNodeAtTrail(this.layout, parentTrail)
    if (!parentNode || parentNode.type !== 'split') return false

    const nextChildren = parentNode.children.filter((_, index) => index !== childIndex)
    let replacement = null
    if (nextChildren.length === 0) {
      replacement = makeEmptyLeaf(this.createEmptyId())
    } else if (nextChildren.length === 1) {
      replacement = cloneValue(nextChildren[0].node)
    } else {
      replacement = {
        ...parentNode,
        children: cloneValue(nextChildren),
      }
    }

    if (parentTrail.length === 0) {
      this.layout = replacement
    } else {
      const grandParentTrail = parentTrail.slice(0, -1)
      const parentIndex = parentTrail.at(-1)
      const grandParentNode = getNodeAtTrail(this.layout, grandParentTrail)
      if (!grandParentNode || grandParentNode.type !== 'split') return false
      grandParentNode.children[parentIndex].node = replacement
    }

    this.bump()
    return true
  }

  createDockTarget(targetId, side = 'right') {
    dedupeEmptyIds(this.layout, this)
    const anchorId = this.getLeafTargetId(targetId)
    if (!anchorId) return null
    const found = findLeaf(this.layout, anchorId)
    if (!found) return null
    const newEmpty = makeEmptyLeaf(this.createEmptyId())
    const direction = side === 'top' || side === 'bottom' ? 'column' : 'row'
    const before = side === 'left' || side === 'top'
    const anchorNode = cloneValue(found.node)
    const splitNode = {
      type: 'split',
      direction,
      children: before
        ? [{ node: newEmpty, ratio: 0.35 }, { node: anchorNode, ratio: 0.65 }]
        : [{ node: anchorNode, ratio: 0.65 }, { node: newEmpty, ratio: 0.35 }],
    }
    this.replaceLeaf(anchorId, splitNode)
    this.bump()
    return newEmpty.id
  }

  dockWindow(id, targetId, options = {}) {
    const windowRecord = this.windows[this.resolveId(id)]
    if (!windowRecord) return false

    let dockTargetId = this.getLeafTargetId(targetId)
    if (!dockTargetId) {
      dockTargetId = this.createDockTarget(targetId, options.side || 'right')
    }
    if (!dockTargetId) return false

    windowRecord.floating = false
    windowRecord.dockTargetId = dockTargetId
    if (options.title !== undefined) windowRecord.title = options.title
    this.syncWindowPersistence(windowRecord)
    this.bump()
    return dockTargetId
  }

  floatWindow(id, extra = {}) {
    const windowRecord = this.windows[this.resolveId(id)]
    if (!windowRecord || windowRecord.floatable === false || windowRecord.mode === 'page') return false

    const measured = this.measurements.windowRects[windowRecord.id]
    if (!windowRecord.floating && measured) {
      windowRecord.left = measured.left + 16
      windowRecord.top = measured.top + 16
      windowRecord.width = measured.width
      windowRecord.height = measured.height
    }

    windowRecord.floating = true
    windowRecord.dockTargetId = null
    Object.assign(windowRecord, extra)
    windowRecord.zIndex = ++this.zCounter
    this.syncWindowPersistence(windowRecord)
    this.bump()
    return true
  }

  loadSessionLayout(sessionLayout) {
    const loadedLayout = sessionLayout?.layout
    if (loadedLayout) {
      this.layout = normalizeLayoutNode(loadedLayout, this)
    } else {
      this.layout = normalizeLayoutNode(this.initialLayout, this)
    }
    dedupeEmptyIds(this.layout, this)
    this.floatingWindows = cloneValue(sessionLayout?.windows) || {}

    const layoutWindowIds = new Set()
    const collectWindowIds = (node) => {
      if (!node) return
      if (node.type === 'split') {
        for (const child of node.children) collectWindowIds(child.node)
      } else if (node.type === 'window' && node.id) {
        layoutWindowIds.add(node.id)
      }
    }
    collectWindowIds(this.layout)
    // TODO: likely needs to be moved to layout updates place or something

    for (const id of Object.values(this.windows)
      .filter((w) => !layoutWindowIds.has(w.id))
      .map((w) => w.id)) {
      this.closeWindow(id)
    }

    for (const windowRecord of Object.values(this.windows)) {
      this.applySavedPlacement(windowRecord)
    }
    this.bump()
  }

  resizeSplit(handle, delta) {
    if (!handle) return false
    const split = getNodeAtTrail(this.layout, handle.trail)
    if (!split || split.type !== 'split') return false
    if (!Array.isArray(handle.sizes) || handle.index < 0 || handle.index >= handle.sizes.length - 1) return false

    const sizes = [...handle.sizes]
    const pairSize = sizes[handle.index] + sizes[handle.index + 1]
    const minSize = Math.min(MIN_PANEL_SIZE, Math.max(24, Math.floor(pairSize / 2) - 1))
    const nextFirst = clamp(sizes[handle.index] + delta, minSize, pairSize - minSize)
    const nextSecond = pairSize - nextFirst
    if (!Number.isFinite(nextFirst) || !Number.isFinite(nextSecond)) return false
    if (Math.abs(nextFirst - sizes[handle.index]) < 0.5) return false

    sizes[handle.index] = nextFirst
    sizes[handle.index + 1] = nextSecond
    const innerSize = Math.max(1, handle.innerSize)

    split.children.forEach((child, index) => {
      child.ratio = sizes[index] / innerSize
      delete child.size
      delete child.grow
    })

    this.bump()
    return true
  }

  serializeLayout(node = this.layout, rect = this.measurements.frame) {
    if (!node) return null
    if (node.type !== 'split') {
      const serialized = node.type === 'window'
        ? { type: 'window', id: node.id }
        : { type: 'empty', id: node.id }
      if (node.layoutKey) serialized.layoutKey = node.layoutKey
      return serialized
    }

    const totalSize = node.direction === 'row' ? rect.width : rect.height
    const sizes = resolveChildSizes(node, totalSize)
    let offset = 0
    const children = node.children.map((child, index) => {
      const childRect = node.direction === 'row'
        ? { left: rect.left + offset, top: rect.top, width: sizes[index], height: rect.height }
        : { left: rect.left, top: rect.top + offset, width: rect.width, height: sizes[index] }
      offset += sizes[index] + PANEL_GAP
      const innerSize = Math.max(0, totalSize - Math.max(0, node.children.length - 1) * PANEL_GAP)
      const ratio = innerSize > 0 ? sizes[index] / innerSize : (Number.isFinite(child.ratio) ? child.ratio : 0)
      return {
        ratio,
        node: this.serializeLayout(child.node, childRect),
      }
    })
    return {
      type: 'split',
      direction: node.direction,
      children,
    }
  }

  getSessionLayout() {
    const windows = cloneValue(this.floatingWindows) || {}
    for (const windowRecord of Object.values(this.windows)) {
      const restoreKey = getWindowRestoreKey(windowRecord)
      if (!restoreKey) continue
      if (windowRecord.floating) {
        windows[restoreKey] = {
          left: forceNumber(windowRecord.left, 48),
          top: forceNumber(windowRecord.top, 48),
          width: forceNumber(windowRecord.width, 512),
          height: forceNumber(windowRecord.height, 360),
          floating: true,
        }
      } else {
        delete windows[restoreKey]
      }
    }

    return {
      layout: this.serializeLayout(),
      windows,
    }
  }

  getRenderState(frame = { width: 0, height: 0 }) {
    this.version
    const page = null
    const tiled = []
    const empty = []
    const floating = []
    const splitHandles = []

    const dockedByTarget = {}
    for (const windowRecord of Object.values(this.windows)) {
      if (!windowRecord.floating && windowRecord.dockTargetId) {
        dockedByTarget[windowRecord.dockTargetId] = windowRecord.id
      }
      if (windowRecord.floating && windowRecord.mode !== 'page') {
        floating.push(windowRecord)
      }
    }

    let pageEntry = page

    const visit = (node, rect, trail = []) => {
      if (!node) return
      if (node.type === 'split') {
        const totalSize = node.direction === 'row' ? rect.width : rect.height
        const sizes = resolveChildSizes(node, totalSize)
        const innerSize = Math.max(0, totalSize - Math.max(0, node.children.length - 1) * PANEL_GAP)
        let offset = 0
        node.children.forEach((child, index) => {
          const childRect = node.direction === 'row'
            ? { left: rect.left + offset, top: rect.top, width: sizes[index], height: rect.height }
            : { left: rect.left, top: rect.top + offset, width: rect.width, height: sizes[index] }

          if (index < node.children.length - 1) {
            splitHandles.push({
              id: `split-${trail.join('.')}-${index}-${node.direction}`,
              trail: [...trail],
              index,
              direction: node.direction,
              rect: node.direction === 'row'
                ? { left: rect.left + offset + sizes[index], top: rect.top, width: PANEL_GAP, height: rect.height }
                : { left: rect.left, top: rect.top + offset + sizes[index], width: rect.width, height: PANEL_GAP },
              sizes: [...sizes],
              innerSize,
            })
          }

          offset += sizes[index] + PANEL_GAP
          visit(child.node, childRect, [...trail, index])
        })
        return
      }

      if (node.type === 'window') {
        const ownWindow = this.windows[node.id]
        const occupyingId = dockedByTarget[node.id]
        const occupyingWindow = occupyingId ? this.windows[occupyingId] : null
        const ownWindowIsHere = ownWindow && !ownWindow.floating
          && (!ownWindow.dockTargetId || ownWindow.dockTargetId === node.id)
        const windowRecord = occupyingWindow && !occupyingWindow.floating
          ? occupyingWindow
          : ownWindowIsHere
            ? ownWindow
            : null

        if (windowRecord) {
          if (windowRecord.mode === 'page') {
            pageEntry = { entry: windowRecord, rect, targetId: node.id }
          } else {
            tiled.push({ entry: windowRecord, rect, targetId: node.id })
          }
          return
        }
        empty.push({ id: node.id, rect })
        return
      }

      const dockedId = dockedByTarget[node.id]
      const windowRecord = dockedId ? this.windows[dockedId] : null
      if (windowRecord && !windowRecord.floating) {
        tiled.push({ entry: windowRecord, rect, targetId: node.id })
      } else {
        empty.push({ id: node.id, rect })
      }
    }

    visit(this.layout, { left: 0, top: 0, width: frame.width || 0, height: frame.height || 0 })

    floating.sort((a, b) => forceNumber(a.zIndex, 0) - forceNumber(b.zIndex, 0))
    return { page: pageEntry, tiled, empty, floating, splitHandles }
  }

  setMeasurements({ frame, renderState }) {
    const windowRects = {}
    const slotRects = {}
    for (const item of renderState.tiled) {
      windowRects[item.entry.id] = item.rect
      slotRects[item.targetId] = item.rect
    }
    if (renderState.page) {
      windowRects[renderState.page.entry.id] = renderState.page.rect
      slotRects[renderState.page.targetId] = renderState.page.rect
    }
    for (const item of renderState.empty) {
      slotRects[item.id] = item.rect
    }
    for (const item of renderState.floating) {
      windowRects[item.id] = {
        left: forceNumber(item.left, 48),
        top: forceNumber(item.top, 48),
        width: forceNumber(item.width, 512),
        height: forceNumber(item.height, 360),
      }
    }
    this.measurements = { frame, windowRects, slotRects }
  }

  markWindowReady(id) {
    const windowRecord = this.windows[this.resolveId(id)]
    if (!windowRecord || windowRecord.readySent || !windowRecord.mountEl) return
    windowRecord.readySent = true
    try {
      windowRecord.onReady?.({
        el: windowRecord.mountEl,
        windowId: windowRecord.id,
        closeWindow: () => this.closeWindow(windowRecord.id),
        floatWindow: (extra = {}) => this.floatWindow(windowRecord.id, extra),
        dockWindow: (targetId, options = {}) => this.dockWindow(windowRecord.id, targetId, options),
      })
    } catch (error) {
      console.error(error)
    }
  }

  destroy() {}
}

export { PANEL_GAP }
