import { WhenRender } from "../types.d.ts";
import { Feed } from 'https://jspm.dev/feed';

export default function render({ bcd, stableFeatures, browsers, browserList, selectedBrowsers, selectedFeatures, helper, featureConfig, warnings }: WhenRender): Response {
  const { __meta } = bcd

  const feed = new Feed({
    title: `Now Stable${(browserList != "") ? ` across ${browserList}` : ""}`,
    description: `Features that are considered stable for ${browserList}`,
    link: '',
    updated: new Date(__meta.timestamp),
    generator: "Time to Stable",
  });


  const features: { [x: string]: any[]; } = {};

  for (const feature of stableFeatures) {
    const { lastDate } = feature;
    const date = `${lastDate.getFullYear()}/${lastDate.getUTCMonth() + 1}`;

    if (date in features == false) features[date] = [];

    features[date].push(feature);
  }

  for (const dateGrouping in features) {

    const groupedFeatures = features[dateGrouping];

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
      }</td><td>${helper.getBrowserName(feature.firstBrowser)
      }</td><td>${feature.firstDate.toLocaleDateString()}</td>
    <td>${helper.getBrowserName(feature.lastBrowser)
      }</td><td>${feature.lastDate.toLocaleDateString()}</td><td>${feature.ageInDays}</td></tr>`, "")}
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