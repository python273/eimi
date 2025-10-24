class EimiScriptCmdTldr {
  constructor({eimiApi}) {
    this.eimiApi = eimiApi;
    this.summarizeRegex = /^\/tldr\s+(https?:\/\/[^\s]+)/;
    this.prompt = `%%readurl($1)\n\n------\n\nWrite a summary.`
  }

  async onRequest(request, newMessage, messages) {
    if (!request.messages.length) return;

    const lastRequestMessage = request.messages[request.messages.length - 1];
    if (lastRequestMessage.role !== 'user' || !lastRequestMessage._id) return;

    const msg = messages.find(msg => msg.id === lastRequestMessage._id);

    if (!msg.content.match(this.summarizeRegex)) return;

    msg.content = msg.content.replace(this.summarizeRegex, this.prompt);

    for (const item of lastRequestMessage.content) {
      if (item.type === 'text' && item.text.match(this.summarizeRegex)) {
        item.text = item.text.replace(this.summarizeRegex, this.prompt);
      }
    }
  }

  async onPostRequest(request, newMessage) {
  }

  onDestroy() {
  }
}

return EimiScriptCmdTldr;