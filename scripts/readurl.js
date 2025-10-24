class EimiScriptReadUrl {
  constructor({eimiApi}) {
    this.eimiApi = eimiApi;
    this.requests = new Map();
  }

  findOriginalMessage(requestMessage, allMessages) {
    if (!requestMessage._id) return requestMessage;
    const original = allMessages.find(m => m.id === requestMessage._id);
    return original || requestMessage;
  }

  async _fetchUrlText(url, originalMessage) {
    const key = `readurl-${url}`;
    originalMessage.customData = originalMessage.customData || [];
    const existing = originalMessage.customData.find(i => i.key === key);
    if (existing) return existing.value;

    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    
    const recheck = originalMessage.customData.find(i => i.key === key);
    if (!recheck) originalMessage.customData.push({ key, value: text });
    return text;
  }

  async fetchUrlText(url, originalMessage) {
    if (this.requests.has(url)) return this.requests.get(url);

    const promise = this._fetchUrlText(url, originalMessage);
    this.requests.set(url, promise);
    try {
      return await promise;
    } finally {
      this.requests.delete(url);
    }
  }

  async onRequest(request, newMessage, messages) {
    request.messages = await Promise.all(request.messages.map(async (m) => {
      const originalMessage = this.findOriginalMessage(m, messages);
      if (!originalMessage) return m;
      
      const newContent = await Promise.all(m.content.map(async (c) => {
        if (c.type !== 'text') return c;
        if (!c.text.includes('%%readurl(')) return c;
        
        const regex = /%%readurl\((https?:\/\/[^)]+)\)/g;
        let matches = [];
        let match;
        while ((match = regex.exec(c.text)) !== null) {
          matches.push({ fullMatch: match[0], url: match[1] });
        }
        if (matches.length === 0) return c;
        
        let newText = c.text;
        for (const { fullMatch, url } of matches) {
          const content = await this.fetchUrlText(url, originalMessage);
          newText = newText.replace(fullMatch, `---\n${content}\n---`);
        }
        return { ...c, text: newText };
      }));
      return { ...m, content: newContent };
    }));
  }
}

return EimiScriptReadUrl;
