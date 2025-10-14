import { writable } from 'svelte/store'
import { genTabUniqueIntId } from "../utils"

const { subscribe, update } = writable([])

const windowsStore = {
  subscribe,
  update,
  add: ({component, data, title='', left=8, top=8, width=512, height=512, buttons=[]}) => {
    const newWindow = {
      id: genTabUniqueIntId(), title, component, data, left, top, width, height, buttons
    }
    update(windows => {
      windows.push(newWindow)
      return windows
    })
    return newWindow.id
  },
  updateById: (wid, newProperties) => {
    update(windows => {
      const window = windows.find(w => w.id === wid)
      if (window) Object.assign(window, newProperties)
      return windows
    })
  },
}

export default windowsStore