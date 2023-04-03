import template from "../../flora.ts";

export default function renderBrowsers(): ReadableStream<any> {
  return template`<nav>
  <ol>
      <li><a href="/">Home</a></li>
  </ol>
</nav>`;
}
