import template from "../../flora.ts";
import { Browsers, BrowserName } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";

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

function renderResults({ bcd, browsers, helper, browserList, stableFeatures, selectedBrowsers, selectedFeatures, featureConfig }: { bcd: CompatData; browsers: Browsers; helper: BrowsersHelper; browserList; stableFeatures; selectedBrowsers: Set<BrowserName>; selectedFeatures: Set<ValidFeatures>; featureConfig: FeatureConfig; }): ReadableStream<any> {

  let currentCategory = "";

  // only show the features selected.

  const tablulateSummary = generateFirstInLastInCrossTab(stableFeatures);

  const output = template`<h2>Stable APIs</h2>
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
  Quick Links: <ul>${[...selectedFeatures].map(selectedFeature => template`<li><a href="#${selectedFeature}-table">${featureConfig[selectedFeature].name}</a></li>`)}</ul>
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
        <tbody>`;
    }

    response = template`${(heading != undefined) ? heading : ""}<tr>
    <td><a href="${feature.mdn_url}">${feature.api}</a> ${("spec_url" in feature) ? template`<a href="${feature.spec_url}" title="${feature.api} specification">📋</a>` : template``}</td><td>${helper.getBrowserName(feature.firstBrowser)}</td><td>${feature.firstDate.toLocaleDateString()}</td>
    <td>${helper.getBrowserName(feature.lastBrowser)}</td><td>${feature.lastDate.toLocaleDateString()}</td><td>${feature.ageInDays}</td></tr>`;

    currentCategory = feature.category;

    return response;
  }
  )}
 </tbody>
</table>`;

  return output;
}

export default function render({ bcd, stableFeatures, submitted, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {

  const { __meta } = bcd

  return template`<html>

  <head>
	<title>Time to Stable ${(browserList != "") ? `across ${browserList}` : ""}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta charset="UTF-8">
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
    <p>For a given set of browsers, what APIs are in all of them and how long did it take for the API to land in the first browser to the last.</p>
    <form method=GET action="/" >
      ${renderWarnings(warnings)}
      ${renderBrowsers(browsers, selectedBrowsers)}
      ${renderFeatures(featureConfig, selectedFeatures)}
      <input type=reset>
      <input type=submit>
    </form>
    
    ${(submitted && warnings.length == 0) ? renderResults({ bcd, browsers, helper, browserList, stableFeatures, selectedBrowsers, selectedFeatures, featureConfig }) : ``}
     
    <footer><p>Created by <a href="https://paul.kinlan.me">Paul Kinlan</a>. Using <a href="https://github.com/mdn/browser-compat-data">BCD</a> version: ${__meta.version}, updated on ${__meta.timestamp}</p></footer>
    </body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
}