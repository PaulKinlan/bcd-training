import template from "../flora.ts";
import { getStableFeatures } from "../bcd.ts";

class Browsers {
  #browsers;
  constructor(browsers) {
    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version): Set => {
    return this.#browsers[browser].releases[version].release_date;
  }

  getBrowserName = (browser): String => {
    return this.#browsers[browser].name;
  }

  getBrowserNames = (selectedBrowsers: Set): String => {
    return [...selectedBrowsers.keys()].map(browser => this.#browsers[browser].name);
  }
}

const renderBrowsers = (browsers, selectedBrowsers: Set) => {
  return template`${Object.entries(browsers).map(([browser, details]) => template`<input type=checkbox name="browser-${browser}" id="browser-${browser}" ${selectedBrowsers.has(browser) ? template`checked=checked` : template``}>
  <label for="browser-${browser}">${details.name}</label>`)}`
};

const renderFeatures = (features, selectedFeatures: Set) => {
  return template`${Object.entries(features).map(([feature, details]) => template`<input type=checkbox name="feature-${feature}" id="feature-${feature}" ${selectedFeatures.has(feature) ? template`checked=checked` : template``}>
  <label for="feature-${feature}">${details.name}</label>`)}`
};

const parseSelectedBrowsers = (request: Request): Set<string> => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('browser-')).map(key => key.replace('browser-', '')));
};

const parseSelectedFeatures = (request: Request): Set<string> => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('feature-')).map(key => key.replace('feature-', '')));
};

export default function render(request: Request, bcd): Response {

  const { __meta, browsers, api, css, html, javascript } = bcd;
  const featureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JavaScript" } };

  const helper = new Browsers(browsers);

  const selectedBrowsers = parseSelectedBrowsers(request);
  const selectedFeatures = parseSelectedFeatures(request);

  // only show the features selected.
  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));

  const stableFeatures = getStableFeatures(browsers, selectedBrowsers, filteredData);

  stableFeatures.sort((a, b) => {
    return b.lastDate - a.lastDate;
  });

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  let browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));

  let currentMonth = "";

  return template`<html>

  <head>
	<title>Now Stable ${(browserList != "") ? `across ${browserList}` : ""}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta name="description" content="A list of features that are considered stable for ${browserList}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  <link rel="shortcut icon" href="/images/favicon.png">
  <style>

  table {
    table-layout:fixed;
    width: 100%;
  }

  table.features {}

  </style>
  </head>
  <body>
    <header>
      <h1>Now Stable</h1>
    </header>
    <nav>
      <ol>
          <li><a href="/">Time to Stable</a></li>
          <li><a href="/when-stable">Now Stable</a></li>
      </ol>
    </nav>
    <form method=GET action="/when-stable" >
      <fieldset>
        <legend>Browsers</legend>
        ${renderBrowsers(browsers, selectedBrowsers)}
      </fieldset>
      <fieldset>
        <legend>Features</legend>
        ${renderFeatures(featureConfig, selectedFeatures)}
      </fieldset>
      <input type=reset>
      <input type=submit>
    </form>

    <h2>Stable APIs</h2>
    <p>Below is a list of features that are all in ${browserList}, ordered reverse chronologically by when they became stable.</p>
    
   ${stableFeatures.map(feature => {
    let response;
    let heading;
    const date = feature.lastDate.getFullYear() + "/" + (feature.lastDate.getUTCMonth() + 1);
    if (currentMonth != date) {
      heading = template`
          ${(date == "") ? "" : "</tbody></table>"}
          <h4>${date}</h4>
          <table>
          <thead>
            <tr>
              <th>API</th>
              <th>First Browser</th>
              <th>Date</th>
              <th>Last Browser</th>
              <th>Date</th>
              <th>Days</th>
            </tr>
          </thead>
          <tbody>`
    }

    response = template`${(heading != undefined) ? heading : ""}<tr>
        <td><a href="${feature.mdn_url}">${feature.api}</a></td><td>${helper.getBrowserName(feature.firstBrowser)}</td><td>${feature.firstDate.toLocaleDateString()}</td>
        <td>${helper.getBrowserName(feature.lastBrowser)}</td><td>${feature.lastDate.toLocaleDateString()}</td><td>${feature.ageInDays}</td></tr>`

    currentMonth = date;

    return response;
  }
  )}
   </tbody>
  </table>
     
    <footer><p>Using BCD version: ${__meta.version}, updated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};