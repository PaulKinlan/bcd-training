import template from "../flora.ts";
import data from "https://esm.sh/@mdn/browser-compat-data@latest/data.json" assert { type: "json" };

class Browsers {
  #browsers;
  constructor(browsers) {
    delete browsers.opera;
    delete browsers.node;
    delete browsers.webview_android;

    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version) => {
    const releases = {};

    return this.#browsers[browser].releases[version].release_date;
  };
}

delete data.webextensions;
delete data.webdriver;
delete data.svg;
delete data.mathml;

console.log(data)
console.log(data.browsers)


export default function render(request: Request) : Response {

  const {__meta} = data;

  return template`<html>

  <head>
	<title>Time to...</title>
	<link rel="stylesheet" href="/styles/default.css">
	<meta name="author" content="Paul Kinlan">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  </head>
  <body>
    ${data.browsers.length}

    <footer><p>Using BCD version: ${__meta.version}, generated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
		.then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};