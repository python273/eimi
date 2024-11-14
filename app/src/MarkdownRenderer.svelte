<script>
import * as smd from "streaming-markdown"
import { onMount } from "svelte";

export let content = "";
export let generating = false;
let element;
let parser;
let prevContent = "";

onMount(() => {
	const renderer = smd.default_renderer(element);
	parser = smd.parser(renderer);
});

$: if (parser && content) {
	if (!content.startsWith(prevContent)) {
		element.innerHTML = '';
		const renderer = smd.default_renderer(element);
		parser = smd.parser(renderer);
		smd.parser_write(parser, content);
		prevContent = content;
	} else {
		const diff = content.slice(prevContent.length);
		if (diff) {
			smd.parser_write(parser, diff);
			prevContent = content;
		}
	}
}

$: if (!generating && parser) {
	smd.parser_end(parser);
}
</script>

<div class="markdown" bind:this={element}></div>

<style>
div {
	margin: 0 0.6em 5px 0.6em;
	min-height: 1em;
}
:global(.markdown > *:first-child) {
	margin-block-start: 0;
}
:global(.markdown > *:last-child) {
	margin-block-end: 0;
}
:global(p, dl) {
	display: block;
	margin-block-start: 1.188em;
	margin-block-end: 1.188em;
}
:global(.markdown :not(pre) > code) {
	border-radius: 3px;
	background-color: rgba(128, 135, 142, 0.09);
}
:global(.markdown pre) {
	border-radius: 3px;
	background-color: rgba(128, 135, 142, 0.09);
}
:global(.markdown blockquote) {
	margin: 0;
	background-color: rgba(0, 0, 0, 0.07);
	border-left: 4px solid var(--text-color);
	/* padding: 0.3em 0 0.3em 0.5em; */
	padding: 0.0em 0 0.0em 0.5em;
	border-radius: 2px;
}
:global(.markdown pre) {
	white-space: pre-wrap;
}
:global(.markdown pre, .markdown code) {
	max-width: 100%;
	overflow-y: auto;
}
:global(.markdown ol, .markdown ul) {
	padding-left: 1.5em;
}
:global(.markdown img) {
	max-width: 100%;
}
</style>
