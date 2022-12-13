import { WhenRender } from "../types.d.ts";
import { Feed } from 'https://jspm.dev/feed';

export default function render({ bcd, features, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {
  const { __meta } = bcd

  const feed = new Feed({
    title: `Now Stable${(browserList != "") ? ` across ${browserList}` : ""}`,
    description: `Features that are considered stable for ${browserList}`,
    link: '',
    updated: new Date(__meta.timestamp),
    generator: "Time to Stable",
  });


  const featureOutput: { [x: string]: any[]; } = {};

  for (const feature of features) {
    const lastDate = feature.stableStats.last.added;
    const date = `${lastDate.getFullYear()}/${lastDate.getUTCMonth() + 1}`;

    if (date in featureOutput == false) featureOutput[date] = [];

    featureOutput[date].push(feature);
  }

  for (const dateGrouping in featureOutput) {

    const groupedFeatures = featureOutput[dateGrouping];

    let table = `<table>
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
    <tbody>${groupedFeatures.reduce((previous, feature) => previous + `
    <tr>
      <td><a href="${feature.mdn_url}">${feature.api}</a> 
        ${("spec_url" in feature)
        ? `<a href="${feature.spec_url}" title="${feature.api} specification">📋</a>`
        : ``
      }</td><td>${helper.getBrowserName(feature.stableStats.first.browser)
      }</td><td>${feature.stableStats.first.added.toLocaleDateString()}</td>
    <td>${helper.getBrowserName(feature.stableStats.last.browser)
      }</td><td>${feature.stableStats.last.added.toLocaleDateString()}</td><td>${feature.stableStats.ageInDays}</td></tr>`, "")}
    </tbody></table>`;

    // Format the features

    feed.addItem({
      title: dateGrouping,
      id: dateGrouping,
      link: `#${dateGrouping}`,
      description: table,
      date: new Date(dateGrouping + '/01')
    })
  }

  return new Response(feed.rss2(), {
    status: 200,
    headers: { "content-type": "application/rss+xml; charset=utf-8" }
  });
};