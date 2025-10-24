class EimiScriptCodeBlockDiffer {
  constructor({eimiApi}) {
    this.eimiApi = eimiApi;
    this.scriptState = window._scriptCodeDiffer = window._scriptCodeDiffer || {};
    this.linesToKeep = 2; // top+bottom

    this.addDiffLibrary();

    this.eimiApi.createEmptyWindow({
      title: "Code Block Diff",
      height: window.innerHeight * 0.98,
      onReady: (arg) => {
        this.windowArgs = arg;
        arg.el.innerHTML = `
          <div style="height: 100%;">
            <div id="diff-content" style="height: 100%;">
              <p>Focus on a message with code blocks to see diff</p>
            </div>
          </div>
        `;

        if (this.scriptState.lastMessageId) {
          this.updateDiffWindow();
        }
      }
    });

    this.focusHandler = (event) => {
      if (!(event.target instanceof Element)) return;
      
      const messageEl = event.target.closest('.message');
      if (messageEl) {
        const messageId = messageEl.dataset.id;
        if (messageId) {
          this.scriptState.lastMessageId = messageId;
          this.updateDiffWindow();
        }
      }
    };
    document.addEventListener('focus', this.focusHandler, true);
  }
  
  addDiffLibrary() {
    if (typeof Diff !== 'undefined') return;
    
    const existingScript = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js"]');
    if (existingScript) return;
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js';
    script.onerror = () => console.error("Failed to load diff library");
    document.head.appendChild(script);
  }
  
  findMessagesWithCodeBlocks(messages) {
    if (!this.scriptState.lastMessageId) return [];
    
    const focusedMessage = messages.find(msg => msg.id === this.scriptState.lastMessageId);
    if (!focusedMessage) return [];
    
    const messagesWithCode = [];
    let currentMessage = focusedMessage;
    
    while (currentMessage) {
      const codeBlocks = this.extractCodeBlocks(currentMessage.content);
      if (codeBlocks.length > 0) {
        messagesWithCode.push(currentMessage);
        if (messagesWithCode.length >= 2) break;
      }
      
      if (currentMessage.parentId) {
        currentMessage = messages.find(msg => msg.id === currentMessage.parentId);
      } else {
        currentMessage = null;
      }
    }
    
    return messagesWithCode.reverse();
  }
  
  updateDiffWindow() {
    if (!this.windowArgs) return;

    const messages = this.eimiApi.getSessionMessages();
    const messagesWithCode = this.findMessagesWithCodeBlocks(messages);

    if (messagesWithCode.length < 2) {
      this.windowArgs.el.querySelector('#diff-content').innerHTML = ''; // keep empty
      return;
    }

    const [firstMessage, secondMessage] = messagesWithCode;
    const firstCodeBlocks = this.extractCodeBlocks(firstMessage.content);
    const secondCodeBlocks = this.extractCodeBlocks(secondMessage.content);

    if (firstCodeBlocks.length === 0 || secondCodeBlocks.length === 0) {
      this.windowArgs.el.querySelector('#diff-content').innerHTML = 
        '<p>No code blocks found in messages</p>';
      return;
    }

    const code1 = firstCodeBlocks[firstCodeBlocks.length - 1];
    const code2 = secondCodeBlocks[secondCodeBlocks.length - 1];

    // Preserve scroll position of the entire window
    let scrollTop = 0;
    const diffContentEl = this.windowArgs.el.querySelector('#diff-content');
    if (diffContentEl && diffContentEl.firstElementChild) {
      scrollTop = diffContentEl.firstElementChild.scrollTop;
    }

    diffContentEl.innerHTML = this.createDiffView(code1, code2);

    // Restore scroll position after updating content
    if (diffContentEl && diffContentEl.firstElementChild) {
      diffContentEl.firstElementChild.scrollTop = scrollTop;
    }
  }
  
  extractCodeBlocks(content) {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex) || [];
    return matches.map(block => block.slice(3, -3).trim());
  }
  
  createDiffView(code1, code2) {
    if (typeof Diff === 'undefined') {
      return "<p>Diff library not loaded. Please try again.</p>";
    }
    
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
    
    const truncateNonChangedBlock = (lines) => {
      if (lines.length <= (this.linesToKeep * 2) + 1) {
        return lines;
      }
      const top = lines.slice(0, this.linesToKeep);
      const bottom = lines.slice(-this.linesToKeep-1);
      return [...top, '[...]', ...bottom];
    };
    
    const diff = Diff.diffLines(code1, code2);
    let result = '<div style="font-family: monospace; white-space: pre-wrap; word-break: break-all; height: 100%; overflow: auto; font-size: 0.85em; background: #000; padding: 0.5em;">';
    
    diff.forEach(part => {
      const color = part.added ? '#0f0' : part.removed ? '#ff6e04' : 'grey';
      const bgColor = part.added ? '#00ff001f' : part.removed ? '#ff00001f' : 'transparent';
      
      // For non-changed parts, truncate middle lines
      let lines = part.value.split('\n')
      if (!part.added && !part.removed) {
        lines = truncateNonChangedBlock(lines);
      }
      
      // Escape HTML in the diff content
      const escapedValue = lines.map(line => escapeHtml(line)).join('\n');
      
      result += `<div style="color: ${color}; background-color: ${bgColor};">`;
      result += escapedValue;
      result += '</div>';
    });
    
    result += '</div>';
    return result;
  }
  
  onDestroy() {
    if (this.focusHandler) {
      document.removeEventListener('focus', this.focusHandler, true);
    }

    this.windowArgs?.closeWindow();
  }
}

return EimiScriptCodeBlockDiffer;