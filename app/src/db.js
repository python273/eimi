import { openDB } from 'idb';

async function initDb() {
	if (navigator.storage && navigator.storage.persist) {
		navigator.storage.persist().then((persistent) => {});
	}

	let q
	try {
		q = await openDB('eimi', 1, {
			upgrade: async function upgrade(db, oldVersion, newVersion, transaction, event) {
				console.log(db, oldVersion, newVersion, transaction, event)
				if (oldVersion < 1) {
					db.createObjectStore('sessions')
					const store = transaction.objectStore('sessions')

					const keys = Object.keys(localStorage)
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i]
						if (key.indexOf('session-') !== 0) { continue }
						await store.put(JSON.parse(localStorage[key]), key.replace(/^session-/, ''))
					}
				}
				await transaction.done

				const keys = Object.keys(localStorage)
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i]
					if (key.indexOf('session-') !== 0) { continue }
					localStorage.removeItem(key)
				}
			},
			blocked(currentVersion, blockedVersion, event) {
				alert('please close other tabs')
			},
			blocking(currentVersion, blockedVersion, event) {
			},
			terminated() {
				alert('idb terminated')
			},
		});
		console.log(q);
	} catch (e) {
		alert('Could not create IndexedDB, try in non-private tab');
		return null;
	}

	return q;
}

export let db = initDb();
window._db = db;
