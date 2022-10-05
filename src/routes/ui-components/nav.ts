import { BrowserName, Browsers } from "../../types.d.ts";
import template from "../../flora.ts";

export default function renderBrowsers(): ReadableStream<any> {
  return template`<nav>
  <ol>
      <li><a href="/">Time to Stable</a></li>
      <li><a href="/not-stable">Not Yet Stable</a></li>
      <li><a href="/when-stable">Now Stable</a></li>
  </ol>
</nav>`;
}
