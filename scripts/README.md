# Eimi Scripts

### Example Script Structure

```javascript
/**
 * @typedef {Object} EimiApi
 * @property {function({messageId: string}): Promise<{newMessage: Object, request: Object}>} genResponse - Generate a response for a specific message ID
 * @property {function(): string} getSessionId - Get the current session ID
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
