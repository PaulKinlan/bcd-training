
import template from "../../flora.ts";

export default function renderWarnings(warnings: Array<string>): ReadableStream<any> {
  return template`<span class="warning"><ul>${warnings.map((warning) => template`<li>${warning}</li>`)
    }</ul></span>`;
};