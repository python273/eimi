import windowsStore from "../lib/windowsStore";
import JsWindow from "./JsWindow.svelte";

export function createJsWindow(content) {
    let mode = null;
    let code = "";

    const jsMatch = content.match(/```(javascript|js)\n(.*?)\n```/s);
    if (jsMatch) {
        mode = "js";
        code = jsMatch[2];
    } else {
        // TODO: broken
        const htmlMatch = content.match(/```html\n(.*?)\n```/s);
        if (htmlMatch) {
            mode = "html";
            code = htmlMatch[1];
        }
    }

    if (mode && code) {
        windowsStore.add(JsWindow, {mode, code}, 'JS exec');
    } else {
        console.error('No Markdown Block With JS/HTML Code Found');
    }
}