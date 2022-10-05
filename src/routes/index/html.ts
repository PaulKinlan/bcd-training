import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { Browsers, BrowserName, CompatResult, ValidFeatures } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";
import renderNavigation from "../ui-components/nav.ts";

type BrowserCrossTabResult = { [K in BrowserName]?: { [K in BrowserName]?: number } }

function generateFirstInLastInCrossTab(stableFeatures: CompatResult[]): BrowserCrossTabResult {

  const output: BrowserCrossTabResult = {};

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
}

function initApiCounts() {
  return {
    api: { total: 0, featureCount: 0 },
    css: { total: 0, featureCount: 0 },
    html: { total: 0, featureCount: 0 },
    javascript: { total: 0, featureCount: 0 }
  }
}

function generateAverage(stableFeatures: CompatResult[]) {
  let total = 0;
  const featureCount = stableFeatures.length;
  const categories: { [Z in ValidFeatures]: { total: number, featureCount: number } } = initApiCounts();
  const firstLanding: { [K: number]: typeof categories } = {  // << Fffark the typeof worked as I guessed. Very cool Typescript. Very cool.
  };
  const firstBrowser: { [K in number]: { [B in BrowserName]?: typeof categories } } = {};
  const lastBrowser: { [K in number]: { [B in BrowserName]?: typeof categories } } = {};

  for (const feature of stableFeatures) {
    total += feature.ageInDays;
    const year = feature.firstDate.getFullYear();
    if (feature.category !== undefined) {
      categories[feature.category].total += feature.ageInDays;
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

      if (feature.firstBrowser in firstBrowser[year] == false) {
        firstBrowser[year][feature.firstBrowser] = initApiCounts();
      }

      if (feature.lastBrowser in lastBrowser[year] == false) {
        lastBrowser[year][feature.lastBrowser] = initApiCounts();
      }

      firstLanding[year][feature.category].total += feature.ageInDays;
      firstLanding[year][feature.category].featureCount++;

      firstBrowser[year][feature.firstBrowser][feature.category].total += feature.ageInDays;
      firstBrowser[year][feature.firstBrowser][feature.category].featureCount++;
      lastBrowser[year][feature.lastBrowser][feature.category].total += feature.ageInDays;
      lastBrowser[year][feature.lastBrowser][feature.category].featureCount++;
    }
  }

  return { total, featureCount, categories, firstLanding, firstBrowser, lastBrowser };
}

function renderResults({ helper, browserList, stableFeatures, selectedBrowsers, selectedFeatures, featureConfig }: { bcd: CompatData; browsers: Browsers; helper: BrowsersHelper; browserList; stableFeatures: CompatResult[]; selectedBrowsers: Set<BrowserName>; selectedFeatures: Set<ValidFeatures>; featureConfig: FeatureConfig; }): ReadableStream<any> {

  let currentCategory = "";

  // only show the features selected.

  const tablulateSummary = generateFirstInLastInCrossTab(stableFeatures);
  const averages = generateAverage(stableFeatures);

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

  <h4>Average time to landing by year of first landing</h4>
  <table>
    <caption>If a feature landed in the earliest browser in 20XX it took Y days on average to become available in the last browser (when considering ${browserList}). TTA (time to available).</caption>
    <thead>
      <tr>  
        <th></th>
        ${[...selectedFeatures].map(category => `<th>${featureConfig[category].name} APIs</th><th>${featureConfig[category].name} TTA</th>`)}
      </tr>
      </thead>
    <tbody>
${template`${Object.entries(averages.firstLanding).map(([year, categories]) => {
    return template`<tr>
    <th>${year}</th>
    ${[...selectedFeatures].map(category => `<td>${categories[category].featureCount}</td><td>${(categories[category].total / categories[category].featureCount).toFixed(2)}</td>`)}
    </tr>`

  })}`}
    </tbody>
  </table>

  <h3>The Tortoise and the Hare</h3>

  <p>There is a natural tension on the web with respect to browser engines. Every engine has their own set of priorities which define the level of investment that they choose to make and on which areas they choose to make it.</p>
  
  <p>A developer naturally wants their experiences to be available to the widest audience possible and these differing priorities create an unevenness on the platform (<a href="https://paul.kinlan.me/the-lumpy-web/">a lumpiness</a>) making it harder for developers to build experiences that work everywhere.
  
  <p>This section highlights where browsers are pushing and pulling on the platform.</p>

  <h4>Sprinters</h4>
  <p>This table is designed to show which browsers are pushing on the platform the most.</p>
  <p>Adding features to quickly is not always desired because developers are unlikely to adopt those features in their sites or apps.</p>
  <table>
    <caption>For a given year, if a feature landed in Browser X first, how many days it take on average to be available in ${browserList}. TTA (time to available).</caption>
    <thead>
      <tr>  
        <th>Year</th>
        ${[...selectedFeatures].map(category => `<th>${featureConfig[category].name}</th><th>${featureConfig[category].name} TTA</th>`)}
      </tr>
      </thead>
    <tbody>
${template`${
  Object.entries(averages.firstBrowser).map(([year, browsers]) =>
  template`
    <tr>
      <th colspan="${(selectedFeatures.size * 2) + 1}" scope="colgroup">${year}</th>
    </tr>
    ${template`${Object.entries(browsers).map(([browser, categories]) => 
      `<tr>
        <th>&nbsp;&nbsp;${helper.getBrowserName(browser)}</th>
        ${[...selectedFeatures].map(category => 
          `<td>${categories[category].featureCount}</td><td>${(categories[category].total / categories[category].featureCount).toFixed(2)}</td>`).join("")}
      </tr>`
    )}`}
  `)// 
}`}
    </tbody>
  </table>

  <h4>Plodders</h4>
  ${((selectedBrowsers.size == 2) ? `<aside>When there are only 2 browsers this table is the inverse of the "Sprinters".</aside>` : ``)}
  <p>This table is designed to show which browsers are pulling on the platform the most.</p>
  <table>
    <caption>For a feature that first landed in year X, how many days did it take on average for the last browser to catch up across ${browserList}. TTA (time to available).</caption>
    <thead>
      <tr>  
        <th>Year</th>
        ${[...selectedFeatures].map(category => `<th>${featureConfig[category].name} count</th><th>${featureConfig[category].name} TTA</th>`)}
      </tr>
      </thead>
    <tbody>
${template`${
  Object.entries(averages.lastBrowser).map(([year, browsers]) =>
  template`
    <tr>
      <th colspan="${(selectedFeatures.size * 2) + 1}" scope="colgroup">${year}</th>
    </tr>
    ${template`${Object.entries(browsers).map(([browser, categories]) => 
      `<tr>
        <th>&nbsp;&nbsp;${helper.getBrowserName(browser)}</th>
        ${[...selectedFeatures].map(category => 
          `<td>${categories[category].featureCount}</td><td>${(categories[category].total / categories[category].featureCount).toFixed(2)}</td>`).join("")}
      </tr>`
    )}`}
  `)// 
}`}
    </tbody>
  </table>

  <h2>Stable APIs</h2>
  <p>Below is a list of features that are in ${browserList}</p>
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
    ${renderNavigation()}
    <p>For a given set of browsers, what APIs are in all of them and how many days it take for the API to land in the first browser to the last.</p>
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