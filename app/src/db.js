import { openDB } from 'idb'

const scriptTrimMessages = `/* Hides text from a message
~~~~
like here
~~~~
*/
return chain.map(m => {
    if (!m.content.includes('~~~~\\n')) return m;
    const newContent = m.content.split(/^~~~~$/gm)
        .filter((_, index) => index % 2 === 0)
        .join('');
    return { ...m, content: newContent };
});
`

const scriptPrompts = `/* Prompts. Start a message with:
- %%R for short answers
*/
const PROMPTS = {
    R: \`You are a helpful assistant. Your responses have no babbling! No code explanations unless asked.\\n\\n\`,
};

return chain.map(m => {
    let newContent = m.content.replace(/%%(\\w+)/g, (match, p1) => PROMPTS[p1] || match);
    return { ...m, content: newContent };
});
`


async function initDb() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((persistent) => {})
  }

  try {
    return await openDB('eimi', 3, {
      upgrade: async function upgrade(db, oldVersion, newVersion, transaction, event) {
        console.log('db upgrade', db, oldVersion, newVersion, transaction, event)
        if (oldVersion < 1) {
          db.createObjectStore('sessions')
        }
        if (oldVersion < 2) {
          db.createObjectStore('scripts', { keyPath: 'id' })
          await transaction.objectStore('scripts').put({
            id: "lzflks6m",
            enabled: true,
            name: "01 Trim Messages",
            sessionId: "",
            scriptChainProcess: scriptTrimMessages,
          })
          await transaction.objectStore('scripts').put({
            id: "lziy5kpb",
            enabled: true,
            name: "02 Prompts",
            sessionId: "",
            scriptChainProcess: scriptPrompts,
          })
        }
        if (oldVersion < 3) {
          const sessionMetaStore = db.createObjectStore('sessionMeta', { keyPath: 'id' })
          const sessionStore = transaction.objectStore('sessions')
          const sessionKeys = await sessionStore.getAllKeys()
          sessionKeys.sort((a, b) => b.localeCompare(a))
          for (const key of sessionKeys) {
            const session = await sessionStore.get(key)
            await sessionMetaStore.put({
              id: key,
              title: session.title,
              createdAt: session.createdAt,
            })
          }
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
    })
  } catch (e) {
    alert('Could not create IndexedDB, try in non-private tab')
  }

  return null
}

export const db = initDb()
window._db = db
