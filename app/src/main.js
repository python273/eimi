import './global.css'
import App from './App.svelte'

window.addEventListener('unload', function(){});
window.addEventListener('beforeunload', function(){});

const app = new App({
  target: document.getElementById('app'),
})

export default app
