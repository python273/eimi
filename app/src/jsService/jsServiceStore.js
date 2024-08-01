import { writable } from 'svelte/store';
import { genTabUniqueIntId } from "../utils";

const { subscribe, update } = writable([]);

const iframeStore = {
	subscribe,
	add: (message) => {
		let mode = null;
		let code = "";

		const jsMatch = message.match(/```(javascript|js)\n(.*?)\n```/s);
		if (jsMatch) {
			mode = "js";
			code = jsMatch[2];
		} else {
			const htmlMatch = message.match(/```html\n(.*?)\n```/s);
			if (htmlMatch) {
				mode = "html";
				code = htmlMatch[1];
			}
		}

		if (mode && code) {
			update(iframes => [...iframes, { id: genTabUniqueIntId(), mode, code }]);
		} else {
			console.error('No Markdown Block With JS/HTML Code Found');
		}
	},
	removeIframe: (id) => {
		update(iframes => iframes.filter(iframe => iframe.id !== id));
	}
};

export default iframeStore;