# Eimi Scripts

- Eimi is an LLM UI with tree comments design.
  * `eimiApi.getSessionMessages` returns *all* messages in current session, not just one chain.
  * But `request.messages` is the ancestor path, root to request message.

- Eimi Script is addon-like JS script.
  * Can be added by user in UI.
  * Ran in `Session.svelte` page context.
  * Have access to `eimiApi` functions.
  * Ran in order of user specified script name (convention is `01 ..`, `02 ..`), which can be important if multiple scripts interact.
  * Can expose slash commands via `static commands` for in-input actions.
  * Can store data using `customData` in a message.
  * Can create windows with custom UI.
  * A script can be a companion to another script, so not necessary using hooks, but have methods for other scripts to use. E.g. tool call script -> scans script instances -> collects tools from other scripts.

### Commands

- Define `static commands = [{ name, run() }]` on the script class.
- Commands are typed as `/name ...` in the input line; matching is per enabled scripts order.
- `run` can mutate the message and return `{next: 'gen'}` to trigger generation.
- `run` can return `{replaceLine: '...'}` to replace the current command line.
- `run` args: `{command, args, message, line, lineStart, lineEnd, cursor, text}`

```javascript
class EimiScriptMyCmd {
  static commands = [{
    name: 'tldr',
    run: async function({args, message, line, lineStart, lineEnd, text}) {
      // note `this` still works
      const match = line?.match(/^\/tldr\s+(https?:\/\/[^\s]+)/) || (`/tldr ${args}`.trim()).match(/^\/tldr\s+(https?:\/\/[^\s]+)/)
      if (!match) throw Error('Usage: /tldr <url>')
      const prompt = `%%readurl(${match[1]})\n\n------\n\nWrite a summary.`
      return {next: 'gen', replaceLine: prompt}
    }
  }]
}
return EimiScriptMyCmd
```

### Example Script Structure

```javascript
/**
 * @typedef {Object} EimiApi
 * @property {function({messageId: string, params?: Object}): Promise<{newMessage: Object, request: Object}>} genResponse - Generate a response for a specific message ID with optional request params
 * @property {function(): string} getSessionId - Get the current session ID
 * @property {function(): Object} getSessionInfo - Get current session data, reactive to field changes like `title` or `parameters`
 * @property {function(): Array} getSessionMessages - Get all messages in the current session (includes multiple subtrees, filter accordingly)
 * @property {function(Object): void} createEmptyWindow - Create a new empty window with optional configuration
 * @param {Object} options - Configuration options for the new window
 * @param {function} [options.onReady] - Callback when the window content is ready, receives {el, closeWindow, ...} as parameter
 * @param {function} [options.onWindowClose] - Callback when the window is closed
 * @property {function(Object): Object} createMessage - Create a new message with provided values, patches defaults
 * @param {Object} values - Message properties to override defaults (more in Session.svelte)
 * @param {string} [values.parentId] - Parent message ID
 * @param {string} [values.role] - Message role ('user', 'assistant', 'system')
 * @param {string} [values.content] - Message content
 * @param {Array} [values.customData] - Custom data fields for the message
 * @returns {Object} The created message object
 * @property {function(string): Array} customDataGetAll - Get all custom data entries for a message
 * @property {function(string, string): Object} customDataGet - Get a custom data entry by key
 * @property {function(string, string, any): Object} customDataSet - Set a custom data entry value by key
 * @property {function(string, string): Object} customDataRemove - Remove a custom data entry by key
 * @property {function(): Object} getSessionScriptInstances - Get script instances map by script id
 * @property {function(): Array} getSessionScripts - Get loaded scripts
 */

class EimiScriptMyExample {  // Must start with `class EimiScript`
  constructor({eimiApi}) {
    /**
     * @type {EimiApi}
     */
    this.eimiApi = eimiApi

    // Script instantiated per session, handling multiple callback calls
  }
  
  async onRequest(request, newMessage, messages) {
    // `request` search for `const request = {` in Session.svelte to see full request structure.
    // `request.messages` is OpenAI-like chain of messages sent to LLM, `.content` is always a list.
    //   * note to get original session message you need to take id from  `_id` and search in eimiApi.getSessionMessages()
    // `newMessage` is going to contain LLM output.
    // `messages` is a full list of messages in a session, including unrelated subtrees.

    // Modify request before it's sent to the LLM
  }
  
  async onPostRequest(request, newMessage) {
    // Process response after it's received from the LLM
  }
  
  onDestroy() {
    // Cleanup when script is unloaded
  }
}

return EimiScriptMyExample  // Must return the class
```
