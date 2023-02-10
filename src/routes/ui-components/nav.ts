import { BrowserName, Browsers } from "../../types.d.ts";
import template from "../../flora.ts";

export default function renderBrowsers(): ReadableStream<any> {
  return template`<nav>
  <ol>
      <li><a href="/">Time to Stable</a></li>
      <li><a href="/not-stable">Not Yet Stable</a></li>
      <li><a href="/when-stable">Now Stable</a></li>
      <li><a href="/experimental">Experimental APIs</a></li>
      <li><a href="/deprecated">Deprecated APIs</a></li>
      <li><a href="/removed">APIs that are no longer on the web</a></li>
      <li><a href="/all">All APIs (for export)</a></li>
  </ol>
</nav>`;
}
