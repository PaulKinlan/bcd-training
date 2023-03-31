import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { Browsers, BrowserName, CompatResult, ValidFeatures } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderFooter from "../ui-components/footer.ts";

export default function render({ bcd, features, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig }: WhenRender): Response {

  console.log(selectedFeatures)

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
      <td><a href="/feature?id=${feature.api}">${feature.api}</a></td>
    </tr>`
  )}
  </tbody>
  </table>

    ${renderFooter(__meta)}
    </body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
}