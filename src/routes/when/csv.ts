import template from "../../flora.ts";
import { CompatResult } from "../../types.d.ts";
import { WhenRender } from "../types.d.ts";

const renderBrowserTimes = (featureConfig, feature: CompatResult) => {
  return Object.values(feature.stable).map(({ name, version_added, date_added, version_removed, date_removed }) => {
    return `${feature.api}|${featureConfig[feature.category].name}|${name}|${date_added || ""}|${version_added || ""}|${date_removed || ""}|${version_removed || ""}`;
  }).join('\n')
};

export default function render({ bcd, features, browsers, browserList, selectedBrowsers, selectedFeatures, helper, all, featureConfig, warnings }: WhenRender): Response {
  const { __meta } = bcd;

  if (warnings.length > 0) {
    return template`There are warnings.`.then(data => new Response(data, {
      status: 501,
      headers: { "content-type": "text/plain; charset=utf-8" }
    }));
  }

  const header = template`API|Category|First Browser|Release Date|Last Browser|Release Date\n`;

  const results = template`${features.map(feature => {
    const { all, stableStats } = feature;
    const { first, last } = stableStats;

    return template`${feature.api}|${featureConfig[feature.category].name}|${all[first.browser].name}|${first.added.toLocaleDateString()}|${all[last.browser].name}|${last.added.toLocaleDateString()}\n`
  })}`

  return template`${header}${results} `.then(data => new Response(data, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  }));
};