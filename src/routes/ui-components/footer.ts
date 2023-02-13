import { BrowserName, Browsers } from "../../types.d.ts";
import template from "../../flora.ts";

export default function renderFooter(): ReadableStream<any> {
  return template`<footer><p>Created by <a href="https://paul.kinlan.me">Paul Kinlan</a>. Using <a href="https://github.com/mdn/browser-compat-data">BCD</a> version: ${__meta.version}, updated on ${__meta.timestamp}</p></footer>`;
}
