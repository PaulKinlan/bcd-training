import template from "../flora.ts";
import { getStableFeatures } from "../bcd.ts";
import Browsers from "../browser.ts";

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

const renderWarnings = (warnings: Array<string>): template => {
  return template`<span class="warning"><ul>${warnings.map(warning => template`<li>${warning}</li>`)}</ul></span>`;
};

const renderResults = (bcd, browsers, helper, browserList, selectedBrowsers: Set<String>, selectedFeatures: Set<String>, featureConfig): template => {

  let currentCategory = "";

  // only show the features selected.
  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));

  const stableFeatures = getStableFeatures(browsers, selectedBrowsers, filteredData);

  const tablulateSummary = generateFirstInLastInCrossTab(stableFeatures);

  return template`<h2>Stable APIs</h2>
  <p>Below is a list of features that are in ${browserList}</p>
  <h3>Summary</h3>
  
  <table class=tabular>
    <caption>A count of the number of APIs that landed in A first and B last.</caption>
    <thead>
      <tr>
        <th></th>
        ${[...selectedBrowsers].map(key => template`<th>Last in ${helper.getBrowserName(key)}</th>`)} 
      </tr>
    </thead>
    <tbody>
      ${[...selectedBrowsers].map((firstInKey) => template`<tr>
        <th scope="row">First in ${helper.getBrowserName(firstInKey)}</th>
        ${[...selectedBrowsers].map((lastInKey) => template`<td>${tablulateSummary[firstInKey][lastInKey]}</td>`)}
        </tr>`)} 
    </tbody>
  </table>

  <h3>Raw Data</h3>
  Quick Links: <ul>${[...selectedFeatures].map(feature => template`<li><a href="#${feature}-table">${featureConfig[feature].name}</a></li>`)}</ul>
  ${stableFeatures.map(feature => {
    let response;
    let heading;
    if (currentCategory != feature.category) {
      heading = template`
        ${(currentCategory == "") ? "" : "</tbody></table>"}
        <h4>${featureConfig[feature.category].name} Data</h4>
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
</table>`;
};

export default function render(request: Request, bcd): Response {

  const url = new URL(request.url);
  const { __meta, browsers, api, css, html, javascript } = bcd;
  const featureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JavaScript" } };

  let warnings = new Array<string>();

  const helper = new Browsers(browsers);

  const selectedBrowsers = parseSelectedBrowsers(request);
  const selectedFeatures = parseSelectedFeatures(request);

  let submitted = url.href.indexOf("?") > -1; // Likely submitted from form with nothing selected.

  if (selectedBrowsers.size < 2 && submitted) {
    warnings.push("Choose at least two browsers to compare");
  }

  if (selectedFeatures.size < 1 && submitted) {
    warnings.push("Choose at least one feature to show");
  }

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  let browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));

  return template`<html>

  <head>
	<title>Time to Stable ${(browserList != "") ? `across ${browserList}` : ""}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta name="description" content="A list of features that are considered stable for ${browserList} and when the landed in the first browser and the last">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <link rel="shortcut icon" href="/images/favicon.png">
	<link rel="author" href="https://paul.kinlan.me/">
  <style>

  table {
    table-layout:fixed;
    width: 100%;
  }

  form span.warning {
    color: red;
  }

  </style>
  </head>
  <body>
    <header>
      <h1>Time to Stable</h1>
    </header>
    <nav>
      <ol>
          <li><a href="/">Time to Stable</a></li>
          <li><a href="/when-stable">Now Stable</a></li>
      </ol>
    </nav>
    <form method=GET action="/" >
      ${renderWarnings(warnings)}
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

    ${(submitted && warnings.length == 0) ? renderResults(bcd, browsers, helper, browserList, selectedBrowsers, selectedFeatures, featureConfig) : ``}
     
    <footer><p>Using BCD version: ${__meta.version}, updated on ${__meta.timestamp}</p></footer>
	</body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};