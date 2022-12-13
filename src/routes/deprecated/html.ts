import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { Browsers, BrowserName, CompatResult, ValidFeatures } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";
import renderNavigation from "../ui-components/nav.ts";

type BrowserCrossTabResult = { [K in BrowserName]?: { [K in BrowserName]?: number } }

function generateFirstInLastInCrossTab(features: CompatResult[]): BrowserCrossTabResult {

  const output: BrowserCrossTabResult = {};

  for (const feature of features) {
    if (feature.stableStats.first.browser in output == false) {
      output[feature.stableStats.first.browser] = {};
    }

    if (feature.stableStats.last.browser in output[feature.stableStats.first.browser] == false) {
      output[feature.stableStats.first.browser][feature.stableStats.last.browser] = 0;
    }

    output[feature.stableStats.first.browser][feature.stableStats.last.browser]++;
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

function generateAverage(features: CompatResult[]) {
  let total = 0;
  const featureCount = features.length;
  const categories: { [Z in ValidFeatures]: { total: number, featureCount: number } } = initApiCounts();
  const firstLanding: { [K: number]: typeof categories } = {  // << Fffark the typeof worked as I guessed. Very cool Typescript. Very cool.
  };
  const firstBrowser: { [K in number]: { [B in BrowserName]?: typeof categories } } = {};
  const lastBrowser: { [K in number]: { [B in BrowserName]?: typeof categories } } = {};

  for (const feature of features) {
    total += feature.stableStats.ageInDays;
    const year = feature.stableStats.first.added.getFullYear();
    if (feature.category !== undefined) {
      categories[feature.category].total += feature.stableStats.ageInDays;
      categories[feature.category].featureCount++;

      if (year in firstLanding == false) {
        firstLanding[year] = initApiCounts();
      }

      if (year in firstBrowser == false) {
        firstBrowser[year] = {};
      }

      if (year in lastBrowser == false) {
        lastBrowser[year] = {};
      }

      if (feature.stableStats.first.browser in firstBrowser[year] == false) {
        firstBrowser[year][feature.stableStats.first.browser] = initApiCounts();
      }

      if (feature.stableStats.last.browser in lastBrowser[year] == false) {
        lastBrowser[year][feature.stableStats.last.browser] = initApiCounts();
      }

      firstLanding[year][feature.category].total += feature.stableStats.ageInDays;
      firstLanding[year][feature.category].featureCount++;

      firstBrowser[year][feature.stableStats.first.browser][feature.category].total += feature.stableStats.ageInDays;
      firstBrowser[year][feature.stableStats.first.browser][feature.category].featureCount++;
      lastBrowser[year][feature.stableStats.last.browser][feature.category].total += feature.stableStats.ageInDays;
      lastBrowser[year][feature.stableStats.last.browser][feature.category].featureCount++;
    }
  }

  return { total, featureCount, categories, firstLanding, firstBrowser, lastBrowser };
}

function renderResults({ helper, browserList, features, selectedBrowsers, selectedFeatures, featureConfig }: { bcd: CompatData; browsers: Browsers; helper: BrowsersHelper; browserList; features: CompatResult[]; selectedBrowsers: Set<BrowserName>; selectedFeatures: Set<ValidFeatures>; featureConfig: FeatureConfig; }): ReadableStream<any> {

  let currentCategory = "";

  // only show the features selected.

  const tablulateSummary = generateFirstInLastInCrossTab(features);
  const averages = generateAverage(features);

  const output = template`
  <h2>Summary</h2>
  
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

  <h4>Average time for an API to become available across ${browserList}</h4>
  <p>${averages.featureCount} APIs took an average of ${(averages.total / averages.featureCount).toFixed(2)} days to become available to use.</p>
  <p>API breakdown:</p>
  <ul>
  ${[...selectedFeatures].map(category => `<li>${featureConfig[category].name}: ${(averages.categories[category].total / averages.categories[category].featureCount).toFixed(2)} days</li>`)}
  </ul>

  <h2>Deprecated APIs</h2>
  <p>Below is a list of features that are deprecated in ${browserList}</p>
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
            <th>Last Browser</th>
            <th>Date</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>`;
        }

        response = template`${(heading != undefined) ? heading : ""}<tr>
    <td>${("mdn_url" in feature && feature.mdn_url != undefined) ? `<a href="${feature.mdn_url}">${feature.api}</a>` : feature.api} ${("spec_url" in feature && feature.spec_url != undefined) ? template`<a href="${feature.spec_url}" title="${feature.api} specification">📋</a>` : template``}</td><td>${helper.getBrowserName(feature.stableStats.first.browser)}</td><td>${feature.stableStats.first.added.toLocaleDateString()}</td>
    <td>${helper.getBrowserName(feature.stableStats.last.browser)}</td><td>${feature.stableStats.last.added.toLocaleDateString()}</td><td>${feature.stableStats.ageInDays}</td></tr>`;

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
	<title>Deprecated ${(browserList != "") ? `across ${browserList}` : ""}</title>
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
      <h1>Deprecated</h1>
    </header>
    ${renderNavigation()}
    <p>For a given set of browsers, what APIs are in all of them and how many days it take for the API to land in the first browser to the last.</p>
    <form method=GET action="/deprecated" >
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