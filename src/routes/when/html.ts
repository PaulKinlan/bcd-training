import template from "../../flora.ts";
import { Browsers, BrowserName } from "../../types.d.ts";
import { FeatureConfig, WhenRender } from "../types.d.ts";
import renderBrowsers from "../ui-components/browsers.ts";
import renderFeatures from "../ui-components/features.ts";
import renderWarnings from "../ui-components/warnings.ts";
import renderNavigation from "../ui-components/nav.ts";
import renderFooter from "../ui-components/footer.ts";

function renderBrowsersQuery(browsers: Browsers, selectedBrowsers: Set<BrowserName>): string {
  return Object.entries(browsers)
    .filter(([browser, details]) => selectedBrowsers.has(<BrowserName>browser))
    .map(([browser, details]) => `browser-${browser}=on`)
    .join('&');
}

function renderFeaturesQuery(features: FeatureConfig, selectedFeatures: Set<string>): string {
  return Object.entries(features)
    .filter(([feature, details]) => selectedFeatures.has(feature))
    .map(([feature, details]) => `feature-${feature}=on`)
    .join('&');
}

export default function render({ bcd, features, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {
  let currentMonth = "";

  const { __meta } = bcd

  return template`<html>
  <head>
	<title>Now Stable ${(browserList != "") ? `across ${browserList}` : ""
    }</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta name="description" content="A list of features that are considered stable for ${browserList}">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta charset="UTF-8">
	<link rel="author" href="https://paul.kinlan.me/">
  <link rel="shortcut icon" href="/images/favicon.png">
  <link rel="alternate" type=”application/rss+xml” href="/when-stable?${renderBrowsersQuery(browsers, selectedBrowsers)}&${renderFeaturesQuery(featureConfig, selectedFeatures)}&type=rss">
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
      <h1>Now Stable</h1>
    </header>
    ${renderNavigation()}
    <p>"New on the Web": For a given set of browsers, what APIs became stable and when, ordered reverse chronologically.</p>
    <p>It's a great source of information for posts like <a href="https://web.dev/tags/new-to-the-web/">this</a></p>
    <form method=GET action="/when-stable">
      ${renderWarnings(warnings)}
      ${renderBrowsers(browsers, selectedBrowsers)}
      ${renderFeatures(featureConfig, selectedFeatures)}
      <input type=reset>
      <input type=submit>
    </form>

    <h2>Stable APIs</h2>
    <p>Below is a list of features that are in ${browserList}, ordered reverse chronologically by when they became stable (i.e, available in the last browser).</p>
    
   ${(warnings.length == 0)
      ? features.map((feature) => {
        let response;
        let heading;
        const date = feature.stableStats.last.added.getFullYear() + "/" +
          (feature.stableStats.last.added.getUTCMonth() + 1);
        if (currentMonth != date) {
          heading = template`
          ${(date == "") ? "" : "</tbody></table>"}
          <h4>${date}</h4>
          <table>
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
        <td>${("mdn_url" in feature && feature.mdn_url != undefined) ? `<a href="${feature.mdn_url}">${feature.api}</a>` : feature.api} ${("spec_url" in feature && feature.spec_url != undefined)
            ? template`<a href="${feature.spec_url}" title="${feature.api} specification">📋</a>`
            : template``
          }</td><td>${helper.getBrowserName(feature.stableStats.first.browser)
          }</td><td>${feature.stableStats.first.added.toLocaleDateString()}</td>
        <td>${helper.getBrowserName(feature.stableStats.last.browser)
          }</td><td>${feature.stableStats.last.added.toLocaleDateString()}</td><td>${feature.stableStats.ageInDays}</td></tr>`;

        currentMonth = date;

        return response;
      })
      : ""
    } 
   </tbody>
  </table>
  ${renderFooter()}
  </body>
  </html>`.then((data) => new Response(data, {
      status: 200,
      headers: { "content-type": "text/html" }
    }));
}