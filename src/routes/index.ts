import template from "../flora.ts";

class Browsers {
  #browsers;
  constructor(browsers) {
    delete browsers.opera;
    delete browsers.node;
    delete browsers.webview_android;

    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version) : Set => {
    const releases = {};

    return this.#browsers[browser].releases[version].release_date;
  };
}

const renderBrowsers = (browsers, selectedBrowsers: Set) => {
  return template`${ Object.entries(browsers).map(([browser, details]) => template`<input type=checkbox name="${browser}" id="${browser}" checked="${selectedBrowsers.has(browser)}">
  <label for="${browser}">${details.name}</label>` ) }`
};

const parseSelectedBrowsers = (request: Request) => {
  const url = new URL(request.url);
  return new Set(url.searchParams.keys()); 
};

export default function render(request: Request, bcd) : Response {

  const {__meta, browsers} = bcd;

  const selectedBrowsers = parseSelectedBrowsers(request);

  return template`<html>

  <head>
	<title>Time to...</title>
	<link rel="stylesheet" href="/styles/default.css">
	<meta name="author" content="Paul Kinlan">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  </head>
  <body>

    <form method=GET action="/" >
      <fieldset>
        <legend>Browsers</legend>
        ${renderBrowsers(browsers, selectedBrowsers)}
      </fieldset>
      <input type=reset>
      <input type=submit>
    </form>

    <footer><p>Using BCD version: ${__meta.version}, generated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
		.then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};