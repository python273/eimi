import { writable } from 'svelte/store';
import { genTabUniqueIntId } from "../utils";

const { subscribe, update } = writable([]);

const windowsStore = {
	subscribe,
	update,
	add: (component, data, title='') => {
		update(x => [...x, { id: genTabUniqueIntId(), title, component, data }]);
	},
	close: (wid) => {
		update(x => x.filter(window => window.id !== wid));
	},
	updateTitle: (id, newTitle) => {
		update(windows => {
			const windowToUpdate = windows.find(window => window.id === id);
			if (windowToUpdate) windowToUpdate.title = newTitle;
			return windows;
		});
	},
};

export default windowsStore;