import template from "../flora.ts";

class Browsers {
  #browsers;
  constructor(browsers) {
    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version): Set => {
    return this.#browsers[browser].releases[version].release_date;
  }

  getBrowserName = (browser) => {
    return this.#browsers[browser].name;
  }

  getBrowserNames = (selectedBrowsers: Set) => {
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

const parseSelectedBrowsers = (request: Request) => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('browser-')).map(key => key.replace('browser-', '')));
};

const parseSelectedFeatures = (request: Request) => {
  const url = new URL(request.url);
  return new Set([...url.searchParams.keys()].filter(key => key.startsWith('feature-')).map(key => key.replace('feature-', '')));
};

function* itterateFeatures(data, parent = "", root = "") {
  for (let [topLevelAPI, information] of Object.entries(data)) {
    if (topLevelAPI.startsWith("__")) {
      continue;
    }
    let newRoot = (root == "") ? topLevelAPI : root;

    let namespaceAPI = "";
    if (root == "") {
      namespaceAPI = "";
    }
    else {
      if (parent == "") {
        namespaceAPI = topLevelAPI;
      }
      else {
        namespaceAPI = `${parent}.${topLevelAPI}`;
      }
    }

    yield [namespaceAPI, information, newRoot];
    // Recurse
    yield* itterateFeatures(information, namespaceAPI, newRoot);
  }
}

const getStableFeatures = (browsers, mustBeIn: Set, data) => {
  const output = [];
  for (let [api, compat, root] of itterateFeatures(data)) {
    if ("__compat" in compat) {
      const dates = [];
      const browserSupport = [];
      let isStable = false;
      let { mdn_url } = compat.__compat;
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
      output.push({
        isStable,
        category: root,
        mdn_url,
        api,
        firstDate: earliest.added,
        firstBrowser: earliest.browser,
        lastDate: latest.added,
        lastBrowser: latest.browser,
        age,
        ageInDays,
      });
    }
  }
  return output;
}

const generateFirstInLastInCrossTab = (stableFeatures) => {

  const output = {};

  for (const feature of stableFeatures) {
    if (feature.firstBrowser in output == false) {
      output[feature.firstBrowser] = {};
    }

    if (feature.lastBrowser in output[feature.firstBrowser] == false) {
      output[feature.firstBrowser][feature.lastBrowser] = 0;
    }

    output[feature.firstBrowser][feature.lastBrowser]++;
  }
  return output;
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

  const tablulateSummary = generateFirstInLastInCrossTab(stableFeatures);

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  let browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));


  let currentCategory = "";

  return template`<html>

  <head>
	<title>Time to Stable</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta name="description" content="A list of features that are considered stable for ${browserList} and when the landed in the first browser and the last">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  <style>

  table {
    table-layout:fixed;
    width: 100%;
  }

  table.features {}

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
    <p>Below is a list of features that are in ${browserList}</p>
    <h3>Summary</h3>
    
    <table class=tabular>
      <caption>First in A / Last in B</caption>
      <thead>
        <tr>
          <th></th>
          ${[...selectedBrowsers].map(key => template`<th>Last in ${helper.getBrowserName(key)}</th>`)} 
        </tr>
      </thead>
      <tbody>
        ${[...selectedBrowsers].map((lastInKey) => template`<tr>
          <th scope="row">First in ${helper.getBrowserName(lastInKey)}</th>
          ${[...selectedBrowsers].map((firstInKey) => template`<td>${tablulateSummary[firstInKey][lastInKey]}</td>`)}
          </tr>`)} 
      </tbody>
    </table>

    <h3>Raw Data</h3>
    Quick Links: <ul>${[...selectedFeatures].map(feature => template`<li><a href="#${feature}-table">${feature}</a></li>`)}</ul>
    ${stableFeatures.map(feature => {
    let response;
    let heading;
    if (currentCategory != feature.category) {
      heading = template`
          ${(currentCategory == "") ? "" : "</tbody></table>"}
          <h4>${feature.category} Data</h4>
          <table id="${feature.category}-table">
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
    
    currentCategory = feature.category;

    return response;
  }
  )}
   </tbody>
  </table>
     
    <footer><p>Using BCD version: ${__meta.version}, generated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};