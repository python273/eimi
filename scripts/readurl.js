/*
Replaces %%readurl(https://..) with Markdown content fetched from the URL via https://r.jina.ai
*/

async function fetchUrlText(url, message) {
  const key = `readurl-${url}`;
  message.customData = message.customData || [];
  const existing = message.customData.find(i => i.key === key);
  if (existing) return existing.value;

  const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
  //const response = await fetch(`https://pure.md/${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const text = await response.text();
  message.customData.push({ key, value: text });
  return text;
}

request.messages = await Promise.all(request.messages.map(async (m) => {
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
      const content = await fetchUrlText(url, m);
      newText = newText.replace(fullMatch, content);
    }
    return { ...c, text: newText };
  }));
  return { ...m, content: newContent };
}));
