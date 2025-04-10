import { openDB } from 'idb'

const scriptTrimMessages = `/* Hides text from a message
~~~~
like here
~~~~
*/
request.messages = request.messages.map(m => {
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

request.messages = request.messages.map(m => {
    let newContent = m.content.replace(/%%(\\w+)/g, (match, p1) => PROMPTS[p1] || match);
    return { ...m, content: newContent };
});
`


async function initDb() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then((persistent) => {})
  }

  try {
    return await openDB('eimi', 4, {
      upgrade: async function upgrade(db, oldVersion, newVersion, transaction, event) {
        console.log('db upgrade', db, oldVersion, newVersion, transaction, event)
        if (oldVersion < 1) {
          db.createObjectStore('sessions')
        }
        if (oldVersion < 2) {
          db.createObjectStore('scripts', { keyPath: 'id' })
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
        if (oldVersion < 4) {
          const scriptStore = transaction.objectStore('scripts')
          const scripts = await scriptStore.getAll()
          for (const script of scripts) {
            script.scriptChainProcess = `throw new Error('Update to request arg');\n${script.scriptChainProcess}`
            await scriptStore.put(script)
          }
          await scriptStore.put({
            id: "lzflks6m",
            enabled: true,
            name: "01 Trim Messages",
            sessionId: "",
            scriptChainProcess: scriptTrimMessages,
          })
          await scriptStore.put({
            id: "lziy5kpb",
            enabled: true,
            name: "02 Prompts",
            sessionId: "",
            scriptChainProcess: scriptPrompts,
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
    })
  } catch (e) {
    alert('Could not create IndexedDB, try in non-private tab')
  }

  return null
}

export const db = initDb()
window._db = db
