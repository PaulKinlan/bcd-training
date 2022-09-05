import template from "../flora.ts";

class Browsers {
  #browsers;
  constructor(browsers) {
    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version): Set => {
    return this.#browsers[browser].releases[version].release_date;
  };

  getBrowserNames = (selectedBrowsers: Set) => {
    return [...selectedBrowsers.keys()].map(browser => this.#browsers[browser].name);
  };
}

const renderBrowsers = (browsers, selectedBrowsers: Set) => {
  return template`${Object.entries(browsers).map(([browser, details]) => template`<input type=checkbox name="browser-${browser}" id="browser-${browser}" ${selectedBrowsers.has(browser) ? template`checked=checked` : template``}>
  <label for="browser-${browser}">${details.name}</label>`)}`
};

const renderFeatures = (features, selectedFeatures: Set) => {
  return template`${Object.entries(features).map(([feature, details]) => template`<input type=checkbox name="feature-${feature}" id="feature-${feature}" ${selectedFeatures.has(feature) ? template`checked=checked` : template``}>
  <label for="feature-${feature}">${details.name}</label>`)}`
};

const parseSelectedBrowsers = (request: Request) => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('browser-')).map(key => key.replace('browser-', '')));
};

const parseSelectedFeatures = (request: Request) => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('feature-')).map(key => key.replace('feature-', '')));
};

function* itterateFeatures(parent, data) {
  for (let [topLevelAPI, information] of Object.entries(data)) {
    const namespaceAPI = `${parent}.${topLevelAPI}`;
    if (topLevelAPI.startsWith("__")) {
      continue;
    }

    yield [namespaceAPI, information];
    //console.log(namespaceAPI, information)
    // Recurse
    yield* itterateFeatures(namespaceAPI, information);
  }
}

const getStableFeatures = (browsers, mustBeIn: Set, data) => {
  const output = [];
  for (let [api, compat] of itterateFeatures("", data)) {
    if ("__compat" in compat) {
      const dates = [];
      const browserSupport = [];
      let isStable = false;
      for (let [browser, support] of Object.entries(compat.__compat.support)) {
        if (mustBeIn.has(browser) == false) continue; // skip if we are not looking for this browser

        if ("version_added" in support === false && Array.isArray(support)) {
          support = support[0] // Smash in the first answer for now.
        }

        if (
          "version_added" in support &&
          support.version_added !== false &&
          support.version_added != null &&
          support.version_added !== true &&
          support.version_added != "preview" &&
          support.version_added.startsWith("≤") === false
        ) {

          const dateAddedInBrowser = browsers[browser].releases[support.version_added].release_date

          dates.push({ browser: browser, added: new Date(dateAddedInBrowser) });
          browserSupport.push(browser);

          // Only stable if in all 'mustBeIn'
          if ([...mustBeIn].every((d) => browserSupport.indexOf(d) >= 0) == true) {
            isStable = true;
          }
        }
      }

      if (isStable == false) continue; // Not stable, skip.

      if (dates.length == 0) continue; // we cant work out if its in a a brower due to weird data.

      // Order the data so we can pick out the first and last.
      dates.sort(function (a, b) {
        return a.added - b.added;
      });

      const [earliest, latest] = [dates[0], dates[dates.length - 1]];
      const age = latest.added - earliest.added;
      const ageInDays = age / (1000 * 60 * 60 * 24);
      output.push([
        isStable,
        api,
        earliest.added,
        earliest.browser,
        latest.added,
        latest.browser,
        age,
        ageInDays,
      ]);
    }
  }
  return output;
}

export default function render(request: Request, bcd): Response {

  const { __meta, browsers, api, css, html, javascript } = bcd;
  const featureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JavaScript" } };

  const helper = new Browsers(browsers);

  const selectedBrowsers = parseSelectedBrowsers(request);
  const selectedFeatures = parseSelectedFeatures(request);

  // only show the features selected.
  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => key in featureConfig));

  const stableFeatures = getStableFeatures(browsers, selectedBrowsers, filteredData);

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

  return template`<html>

  <head>
	<title>Time to...</title>
	<link rel="stylesheet" href="/styles/default.css">
	<meta name="author" content="Paul Kinlan">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  <style>

  table {
    table-layout:fixed;
  }

  </style>
  </head>
  <body>

    <form method=GET action="/" >
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
    <p>Below is a list of features that are in ${formatter.format(helper.getBrowserNames(selectedBrowsers))}</p>
    <h3>Summary</h3>


    <h3>Raw Data</h3>
    <table>
      <thead>
        <td>API</td>
        <td>First Browser</td>
        <td>Date</td>
        <td>Last Browser</td>
        <td>Date</td>
        <td>Days</td>
      </thead>
      <tbody>
        ${ stableFeatures.map(feature => template`<tr>
          <td>${feature[1]}</td><td>${feature[3]}</td><td>${feature[2]}</td>
          <td>${feature[5]}</td><td>${feature[4]}</td><td>${feature[7]}</td></tr>`) }
      </tbody>
    </table>
    <footer><p>Using BCD version: ${__meta.version}, generated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};