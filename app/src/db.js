import { openDB } from 'idb';

async function initDb() {
	if (navigator.storage && navigator.storage.persist) {
		navigator.storage.persist().then((persistent) => {});
	}

	try {
		return await openDB('eimi', 2, {
			upgrade: async function upgrade(db, oldVersion, newVersion, transaction, event) {
				console.log('db upgrade', db, oldVersion, newVersion, transaction, event)
				if (oldVersion < 1) {
					db.createObjectStore('sessions')
				}
				if (oldVersion < 2) {
					db.createObjectStore('scripts', { keyPath: 'id' });
					await transaction.objectStore('scripts').put({
						id: "lzflks6m",
						enabled: true,
						name: "01 Trim Messages",
						sessionId: "",
						scriptChainProcess: "return chain.map(m => {\n    if (!m.content.includes('~~~~\\n')) return m;\n    const newContent = m.content.split('~~~~\\n')\n        .filter((_, index) => index % 2 === 0)\n        .join('');\n    return { ...m, content: newContent };\n});"
					})
				}
				await transaction.done
			},
			blocked(currentVersion, blockedVersion, event) {
				alert('please close other tabs to upgrade db')
			},
			blocking(currentVersion, blockedVersion, event) {
			},
			terminated() {
				alert('idb terminated')
			},
		});
	} catch (e) {
		alert('Could not create IndexedDB, try in non-private tab');
	}

	return null;
}

export let db = initDb();
window._db = db;
