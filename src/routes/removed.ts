import { CompatData } from "../types.d.ts";
import { getFeatures } from "../bcd.ts";
import BrowsersHelper from "../browser.ts";
import { parseResponse, parseSelectedBrowsers, parseSelectedFeatures } from "./_utils/request.ts";
import { FeatureConfig, WhenRender } from "./types.d.ts";

import htmlRender from './removed/html.ts';
import _404Render from './errors/404.ts';

const controllers = {
  'html': htmlRender,
  'rss': _404Render
}

export default function render(request: Request, bcd: CompatData): Response {

  const url = new URL(request.url);
  const { __meta, browsers } = bcd;
  const featureConfig: FeatureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JS" } };

  const warnings = new Array<string>();
  const helper = new BrowsersHelper(browsers);

  const selectedBrowsers = parseSelectedBrowsers(request);
  const selectedFeatures = parseSelectedFeatures(request);
  const responseType = parseResponse(request);

  const submitted = url.href.indexOf("?") > -1; // Likely submitted from form with nothing selected.

  if (selectedBrowsers.size < 2 && submitted) {
    warnings.push("Choose at least two browsers to compare");
  }

  if (selectedFeatures.size < 1 && submitted) {
    warnings.push("Choose at least one feature to show");
  }

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  const browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));

  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));

  const features = getFeatures(browsers, selectedBrowsers, filteredData)
    .filter(feature => feature.removedStats && feature.removedStats.isRemoved);

  const data: WhenRender = {
    bcd,
    features,
    browserList,
    browsers,
    helper,
    featureConfig,
    selectedFeatures,
    selectedBrowsers,
    submitted,
    warnings
  };

  return controllers[responseType](data);
}