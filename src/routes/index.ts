import template from "../flora.ts";

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

const renderBrowsers = (browsers) => {
  return template`${ Object.entries(browsers).map(([browser, details]) => template`<input type=checkbox name="${browser}" id="${browser}">
  <label for="${browser}">${details.name}</label>` ) }`
};

export default function render(request: Request, bcd) : Response {

  const {__meta, browsers} = bcd;

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
        ${renderBrowsers(browsers)}
      </fieldset>
      <input type=reset>
      <input type=submit>
    </form>

    <footer><p>Using BCD version: ${__meta.version}, generated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
		.then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};