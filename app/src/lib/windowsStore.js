import { writable } from 'svelte/store'
import { genTabUniqueIntId } from "../utils"

const { subscribe, update } = writable([])

const windowsStore = {
	subscribe,
	update,
	add: ({component, data, title='', left=8, top=8, buttons=[]}) => {
		update(windows => {
			windows.push({
				id: genTabUniqueIntId(), title, component, data, left, top, buttons
			})
			return windows
		})
	},
	updateById: (wid, newProperties) => {
		update(windows => {
			const window = windows.find(w => w.id === wid)
			if (window) Object.assign(window, newProperties)
			return windows
		})
	},
	close: (wid) => {
		update(windows => {
			const index = windows.findIndex(w => w.id === wid)
			if (index > -1) windows.splice(index, 1)
			return windows
		})
	},
}

export default windowsStore