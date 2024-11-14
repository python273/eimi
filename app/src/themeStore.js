import { writable } from 'svelte/store';

function createThemeStore() {
	const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	let initialValue = prefersDarkMode;
	if (localStorage.getItem("cfg-dark-theme") !== null) {
		initialValue = localStorage.getItem("cfg-dark-theme") === "1";
	}

	const { subscribe, set } = writable(initialValue);

	subscribe(value => {
		localStorage.setItem("cfg-dark-theme", value ? "1" : "0");
	});

	window.addEventListener('storage', (event) => {
		if (event.key === "cfg-dark-theme") {
			set(event.newValue === "1");
		}
	});

	return {subscribe, set};
}

export const themeStore = createThemeStore();
