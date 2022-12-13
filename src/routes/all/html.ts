import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { Browsers, BrowserName, CompatResult, ValidFeatures } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";
import renderNavigation from "../ui-components/nav.ts";

function renderResults({ helper, browserList, features, selectedBrowsers, selectedFeatures, featureConfig }: WhenRender): ReadableStream<any> {

  // only show the features selected.
  const output = template`
  <h2>Summary</h2>

  <h2>All APIs</h2>
  <p>Below is a list of features that are in all filtered by ${browserList}</p>
  <h3>Raw Data</h3>
  <table>
  <thead>
    <tr>
      <th>API</th>
      <th>Category</th>
    </tr>
  </thead>
  <tbody>
  ${features.map(feature => template`
    
      <tr>
        <td>${("mdn_url" in feature && feature.mdn_url != undefined) ? `<a href="${feature.mdn_url}">${feature.api}</a>` : feature.api} ${("spec_url" in feature && feature.spec_url != undefined) ? template`<a href="${feature.spec_url}" title="${featureConfig[feature.category].name} specification">📋</a>` : template``}</td><td>${featureConfig[feature.category].name}</td>
      </tr>`
  )}
 </tbody>
</table>`;

  return output;
}

export default function render({ bcd, features, submitted, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {

  const { __meta } = bcd

  return template`<html>

  <head>
	<title>All features</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta charset="UTF-8">
  <meta name="description" content="A list of features that are considered "Experimental" for ${browserList} and when the landed in the first browser and the last">
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
      <h1>All APIs</h1>
    </header>
    ${renderNavigation()}
    <p>For a given set of browsers what is the API status</p>
    <form method=GET action="/all" >
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