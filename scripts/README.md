# Eimi Scripts

### Example Script Structure

```javascript
/**
 * @typedef {Object} EimiApi
 * @property {function({messageId: string}): Promise<{newMessage: Object, request: Object}>} genResponse - Generate a response for a specific message ID
 * @property {function(): string} getSessionId - Get the current session ID
 * @property {function(): Array} getSessionMessages - Get all messages in the current session (includes multiple subtrees, filter accordingly)
 * @property {function(Object): void} createEmptyWindow - Create a new empty window with optional configuration
 * @param {Object} options - Configuration options for the new window
 * @param {function} [options.onReady] - Callback when the window content is ready, receives {el, closeWindow, ...} as parameter
 * @param {function} [options.onWindowClose] - Callback when the window is closed
 */

class EimiScriptMyExample {  // Must start with `class EimiScript`
  constructor({eimiApi}) {
    /**
     * @type {EimiApi}
     */
    this.eimiApi = eimiApi;

    // Script instantiated per session, handling multiple callback calls
  }
  
  async onRequest(request, newMessage, messages) {
    // `request` search for `const request = {` in Session.svelte to see full request structure.
    // `request.messages` is OpenAI-like chain of messages sent to LLM, `.content` is always a list.
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

return EimiScriptMyExample;  // Must return the class
```
