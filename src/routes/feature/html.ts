import BrowsersHelper from "../../browser.ts";
import template from "../../flora.ts";
import { CompatData, CompatResult } from "../../types.d.ts";

import renderNav from "../ui-components/nav.ts";
import renderFooter from "../ui-components/footer.ts";

type FeatureData = { features: CompatResult[]; bcd: CompatData; browserList: any; helper: BrowsersHelper, featureName: string | null }

export default function render({ bcd, featureName, helper }: FeatureData): Response {

  const { __meta } = bcd;

  if (!featureName) {
    return new Response(`Feature ID is required`, { status: 400, headers: { 'content-type': 'text/plain' } });
  }

  const feature = featureName.split(".").reduce((acc, key) => {
    return acc?.[key]
  }, bcd);

  if (!feature || !feature.__compat) {
    return new Response(`Feature "${featureName}" not found`, { status: 404, headers: { 'content-type': 'text/plain' } });
  }

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

function getSupportStatement(support: any, browser: string): any {
  const browserSupport = support[browser];
  // If support data is an array, use the first entry (most recent/current support)
  return Array.isArray(browserSupport) ? browserSupport[0] : browserSupport;
}

function renderNotes(support: any, browser: string): string {
  const browserSupport = support[browser];
  const entries = Array.isArray(browserSupport) ? browserSupport : [browserSupport];
  
  const notes: string[] = [];
  for (const entry of entries) {
    if (entry && entry.notes) {
      if (Array.isArray(entry.notes)) {
        notes.push(...entry.notes.filter((n: unknown) => typeof n === 'string'));
      } else if (typeof entry.notes === 'string') {
        notes.push(entry.notes);
      }
    }
  }
  
  if (notes.length === 0) {
    return "";
  }
  
  return ` <em>Note: ${notes.join(' ')}</em>`;
}

function renderVersionRemoved(support: any, browser: string, helper: BrowsersHelper): any {
  const supportStatement = getSupportStatement(support, browser);
  if (!supportStatement || !("version_removed" in supportStatement)) {
    return "";
  }
  return `Removed from ${helper.getBrowserName(browser)} version ${supportStatement.version_removed} on ${helper.getBrowserReleaseDate(browser, supportStatement.version_removed)}`;
}

function renderVersionAdded(support: any, browser: string, helper: BrowsersHelper): any {
  const supportStatement = getSupportStatement(support, browser);

  if (!supportStatement || ("version_added" in supportStatement) == false) {
    return `Not in ${helper.getBrowserName(browser)}${renderNotes(support, browser)}`;
  }

  if (supportStatement.version_added === true) {
    return `In ${helper.getBrowserName(browser)} from the start${renderNotes(support, browser)}`;
  }

  if (supportStatement.version_added === null) {
    return `Not in ${helper.getBrowserName(browser)}${renderNotes(support, browser)}`;
  }

  if (supportStatement.version_added === false) {
    return `Not in ${helper.getBrowserName(browser)}${renderNotes(support, browser)}`;
  }

  return `In ${helper.getBrowserName(browser)} version ${supportStatement.version_added} on ${helper.getBrowserReleaseDate(browser, supportStatement.version_added)}${renderNotes(support, browser)}`;
}
