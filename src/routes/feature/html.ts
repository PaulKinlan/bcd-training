import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { CompatData, CompatResult } from "../../types.d.ts";

import renderNav from "../ui-components/nav.ts";
import renderFooter from "../ui-components/footer.ts";

type FeatureData = { features: CompatResult[]; bcd: CompatData; browserList: any; helper: BrowsersHelper, featureName: string }

export default function render({ bcd, featureName, helper }: FeatureData): Response {

  const { __meta } = bcd;

  const feature = featureName.split(".").reduce((acc, key) => {
    return acc[key]
  }, bcd);

  const { mdn_url, spec_url, support, status } = feature.__compat;

  return template`<html>

  <head>
	<title>Feature: ${featureName}</title>
	<meta name="description" content="A summary of Browser Compat Data for ${featureName}">
  <link rel="stylesheet" href="/styles/water.css">
	<meta name="author" content="Paul Kinlan">
  	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  	<link rel="shortcut icon" href="/images/favicon.png">
	<link rel="author" href="https://paul.kinlan.me/">
  <style>
  </style>
  </head>
  <body>
    <header>
      ${renderNav()}
      <h1>${featureName}</h1>
    </header>

    <p><a href="${spec_url}">Spec</a></p>
    <p><a href="${mdn_url}">MDN URL</a></p>

    <h2>Status</h2>
    <p>On the standards track: ${status.standard_track ? "Yes" : "No"}</p>
    <p>Is Experimental: ${status.experimental ? "Yes" : "No"}</p>
    <p>Is Deprecated: ${status.deprecated ? "Yes" : "No"}</p>

    <h2>Browser Support</h2>
    ${Object.keys(support).map((browser) => template`
    <p>
      ${renderVersionAdded(support, browser, helper)}
      ${renderVersionRemoved(support, browser, helper)}
    </p>`)
    }
    ${renderFooter(__meta)}
    </body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
}

function renderVersionRemoved(support: any, browser: string, helper: BrowsersHelper): any {
  return ("version_removed" in support[browser]) ? `Removed from ${helper.getBrowserName(browser)} version ${support[browser].version_removed} on ${helper.getBrowserReleaseDate(browser, support[browser].version_removed)}` : "";
}

function renderVersionAdded(support: any, browser: string, helper: BrowsersHelper): any {

  if (("version_added" in support[browser]) == false) {
    return `Not in ${helper.getBrowserName(browser)}`;
  }

  if (support[browser].version_added === true) {
    return `In ${helper.getBrowserName(browser)} from the start`;
  }

  if (support[browser].version_added === null) {
    return `Not in ${helper.getBrowserName(browser)}`;
  }

  if (support[browser].version_added === false) {
    return `Not in ${helper.getBrowserName(browser)}`;
  }

  return `In ${helper.getBrowserName(browser)} version ${support[browser].version_added} on ${helper.getBrowserReleaseDate(browser, support[browser].version_added)}`;
}
