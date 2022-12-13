import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { Browsers, BrowserName, CompatResult, ValidFeatures } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";
import renderNavigation from "../ui-components/nav.ts";

function generateCrossTab(features: CompatResult[], mustBeIn: BrowserName[]) {

  const output: { [K in BrowserName]?: { [K in BrowserName]?: number } } = {};
  type FeatureSupport = { [K in BrowserName]?: boolean };

  for (const feature of features) {
    const featureIn: BrowserName[] = [];
    const featureNotIn: BrowserName[] = [];

    for (const browser of mustBeIn) {
      if (feature.stableStats.browsers.includes(browser)) {
        featureIn.push(browser);
      }
      else {
        featureNotIn.push(browser)
      }
    }

    for (const browser of featureIn) {
      if (browser in output == false) output[browser] = {};

      for (const browserNotIn of featureNotIn) {
        if (browserNotIn in output[browser] == false) output[browser][browserNotIn] = 0;

        output[browser][browserNotIn]++;

      }

    }
  }

  return output;
}

function initApiCounts() {
  return {
    api: { total: 0, featureCount: 0 },
    css: { total: 0, featureCount: 0 },
    html: { total: 0, featureCount: 0 },
    javascript: { total: 0, featureCount: 0 }
  }
}

function renderResults({ helper, browserList, features, selectedBrowsers, selectedFeatures, featureConfig }: { bcd: CompatData; browsers: Browsers; helper: BrowsersHelper; browserList; features: CompatResult[]; selectedBrowsers: Set<BrowserName>; selectedFeatures: Set<ValidFeatures>; featureConfig: FeatureConfig; }): ReadableStream<any> {

  let currentCategory = "";

  // only show the features selected.

  const tablulateSummary = generateCrossTab(features, selectedBrowsers);

  const output = template`
  <h2>Summary</h2>
  
  <table class=tabular>
    <caption>A count of the number of APIs are in Browser X but not in Browser Y.</caption>
    <thead>
      <tr>
        <th></th>
        ${[...selectedBrowsers].map(key => template`<th>Not in ${helper.getBrowserName(key)}</th>`)} 
      </tr>
    </thead>
    <tbody>
      ${[...selectedBrowsers].map((firstInKey) => template`<tr>
        <th scope="row">In ${helper.getBrowserName(firstInKey)}</th>
        ${[...selectedBrowsers].map((lastInKey) => template`<td>${tablulateSummary[firstInKey][lastInKey]}</td>`)}
        </tr>`)} 
    </tbody>
  </table>

  <h2>Unstable APIs</h2>
  <p>Below is a list of features that are <strong>not in</strong> all of ${browserList}</p>
  <h3>Raw Data</h3>
  Quick Links: <ul>${[...selectedFeatures].map(selectedFeature => template`<li><a href="#${selectedFeature}-table">${featureConfig[selectedFeature].name}</a></li>`)}</ul>
  ${features.map(feature => {
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
            <th>Days in Limbo</th>
          </tr>
        </thead>
        <tbody>`;
    }
    
    response = template`${(heading != undefined) ? heading : ""}<tr>
    <td>${("mdn_url" in feature && feature.mdn_url != undefined) ? `<a href="${feature.mdn_url}">${feature.api}</a>` : feature.api} ${("spec_url" in feature && feature.spec_url != undefined) ? template`<a href="${feature.spec_url}" title="${feature.api} specification">📋</a>` : template``}</td><td>${helper.getBrowserName(feature.stableStats.first.browser)}</td><td>${feature.stableStats.first.added.toLocaleDateString()}</td><td>${((Date.now() - feature.stableStats.first.added.getTime()) / (1000 * 24 * 60 * 60)).toFixed(0)}</td></tr>`;

    currentCategory = feature.category;

    return response;
  }
  )}
 </tbody>
</table>`;

  return output;
}

export default function render({ bcd, features, submitted, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {

  const { __meta } = bcd

  return template`<html>

  <head>
	<title>Not yet stable ${(browserList != "") ? `across ${browserList}` : ""}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta charset="UTF-8">
  <meta name="description" content="A list of features that are not yet considered stable for ${browserList}.">
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
      <h1>Not yet stable</h1>
    </header>
    ${renderNavigation()}
    <p>For a given set of browsers, what APIs <strong>are not yet</strong> in all of them.</p>
    <form method=GET action="/not-stable" >
      ${renderWarnings(warnings)}
      ${renderBrowsers(browsers, selectedBrowsers)}
      ${renderFeatures(featureConfig, selectedFeatures)}
      <input type=reset>
      <input type=submit>
    </form>
    
    ${(submitted && warnings.length == 0) ? renderResults({ bcd, browsers, helper, browserList, features, selectedBrowsers, selectedFeatures, featureConfig }) : ``}
     
    <footer><p>Created by <a href="https://paul.kinlan.me">Paul Kinlan</a>. Using <a href="https://github.com/mdn/browser-compat-data">BCD</a> version: ${__meta.version}, updated on ${__meta.timestamp}</p></footer>
    </body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
}