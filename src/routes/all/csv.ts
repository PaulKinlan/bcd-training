import template from "../../flora.ts";
import { CompatResult } from "../../types.d.ts";
import { WhenRender } from "../types.d.ts";

const renderBrowserTimes = (featureConfig, feature: CompatResult) => {
  return Object.values(feature.all).map(({name, version_added, date_added, version_removed, date_removed}) => { 
    return `${feature.api}|${featureConfig[feature.category].name}|${name}|${date_added || ""}|${version_added|| ""}|${date_removed || ""}|${version_removed || ""}`;
  }).join('\n')
};

export default function render({ bcd, features, browsers, browserList, selectedBrowsers, selectedFeatures, helper, all, featureConfig, warnings }: WhenRender): Response {
  const { __meta } = bcd

  const header = template`API|Category|Browser|Release Date|Release Version|Removed Date|Removed Version\n`;

  const results = template`${features.map(feature =>
    template`${renderBrowserTimes(featureConfig, feature)}\n`
  )}`

  return template`${header}${results}`.then(data => new Response(data, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  }));
};