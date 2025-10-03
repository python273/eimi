<script>
import { themeStore } from './themeStore.js'
import { subThemeChange } from './utils.js'

function getCurrentTheme() {
  const lightTheme = localStorage.getItem('cfg-theme-light') || 'light'
  const darkTheme = localStorage.getItem('cfg-theme-dark') || 'dark'

  if ($themeStore.theme === 'light') {
    return lightTheme
  } else if ($themeStore.theme === 'dark') {
    return darkTheme
  } else {
    // system preference
    return $themeStore.isDark ? darkTheme : lightTheme
  }
}

let currentTheme = $state(getCurrentTheme())

$effect(() => {
  $subThemeChange
  currentTheme = getCurrentTheme()
})

$effect(() => {
  if ($themeStore.isDark) {
    document.body.classList.add('theme-dark')
    document.body.classList.remove('theme-light')
  } else {
    document.body.classList.add('theme-light')
    document.body.classList.remove('theme-dark')
  }
})
</script>

{#if currentTheme === 'light'}
<style>
  :root {
    --bg-color: #ecedee;
    --text-color: #000;
    --comment-bg-color: #fff;
    --panel-bg-color: #f7f7f7;
    --meta-color: rgb(94, 126, 142);
    --code-bg-color: #eceef0;
  }
  html {
    scrollbar-color: #000 transparent;
  }
</style>
{:else if currentTheme === 'dark'}
<style>
  :root {
    --bg-color: #181412;
    --text-color: rgb(233, 225, 204);
    --comment-bg-color: rgb(55, 45, 40);
    --panel-bg-color: #241e1b;
    --meta-color: rgb(179, 172, 152);
    --code-bg-color: rgb(70, 56, 50);
  }
  html {
    scrollbar-color: #fff transparent;
  }
</style>
{:else if currentTheme === 'lavender'}
<style>
  :root {
    --bg-color: #fceaff;
    --text-color: #4f109b;
    --comment-bg-color: #fadaff;
    --panel-bg-color: #f5def9;
    --meta-color: #7b1fa2;
    --code-bg-color: #e1bee7;
    --brand-color: #9c27b0;
    --brand-hover-color: #8e24aa;
    --brand-active-color: #7b1fa2;
    --visited-link: #5e35b1;
  }
  html {
    scrollbar-color: #000 transparent;
  }
</style>
{:else if currentTheme === 'smolder'}
<style>
  :root {
    --bg-color: #000000;
    --text-color: #aaa;
    --comment-bg-color: #151515;
    --panel-bg-color: #111;
    --meta-color: #bdbdbd;
    --code-bg-color: #1a1a1a;
    --brand-color: #b14200;
    --brand-hover-color: #cc550e;
    --brand-active-color: #df5706;
    --visited-link: #ea80fc;
  }
  html {
    scrollbar-color: #646464 transparent;
  }
</style>
{:else}
<!-- Default fallback to light theme -->
<style>
  :root {
    --bg-color: #ecedee;
    --text-color: #000;
    --comment-bg-color: #fff;
    --panel-bg-color: #f7f7f7;
    --meta-color: rgb(94, 126, 142);
    --code-bg-color: #eceef0;
    --brand-color: #1ec14a;
    --brand-hover-color: #11d545;
    --brand-active-color: #0cb339;
    --visited-link: #c143f9;
  }
  html {
    scrollbar-color: #000 transparent;
  }
</style>
{/if}