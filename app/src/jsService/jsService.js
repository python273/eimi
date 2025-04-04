import windowsStore from "../lib/windowsStore"
import JsWindow from "./JsWindow.svelte"

const jsRegex = /```(javascript|js)\n(.*?\n)```/s
const htmlRegex = /```html\n(.*?\n)```/s

export function hasCodeBlocks(content) {
    return jsRegex.test(content) || htmlRegex.test(content)
}

export function getCode({content}) {
    let mode = null
    let code = ""

    const jsMatch = content.match(jsRegex)
    if (jsMatch) {
        mode = "js"
        code = jsMatch[2]
    } else {
        const htmlMatch = content.match(htmlRegex)
        if (htmlMatch) {
            mode = "html"
            code = htmlMatch[1]
        }
    }

    return {mode, code}
}

export function createJsWindow(comment) {
    const buttons = [{methodName: 'refresh', label: 'refresh'}]
    if (window._pasteHtml) buttons.push({methodName: 'pasteHtml', label: 'publish'})
    windowsStore.add({
        component: JsWindow,
        data: {comment},
        title: 'HTML/JS exec',
        buttons,
    })
}
