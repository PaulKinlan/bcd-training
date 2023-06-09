import { CompatData } from "../types.d.ts";
import { getFeatures } from "../bcd.ts";
import BrowsersHelper from "../browser.ts";
import { parseResponse } from "./_utils/request.ts";
import { FeatureConfig, WhenRender } from "./types.d.ts";

import htmlRender from './index/html.ts';
import _404Render from './errors/404.ts';

const controllers = {
  'csv': _404Render,
  'html': htmlRender,
  'rss': _404Render
}

export default function render(request: Request, bcd: CompatData): Response {

  const url = new URL(request.url);
  const { __meta, browsers } = bcd;
  const featureConfig: FeatureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JS" } };

  const warnings = new Array<string>();
  const helper = new BrowsersHelper(browsers);

  const selectedBrowsers = helper.getBrowserIds();
  const selectedFeatures = new Set(['api', 'css', 'javascript', 'html']);
  const responseType = parseResponse(request);


  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  const browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));

  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));

  const features = getFeatures(browsers, selectedBrowsers, filteredData);

  const data: WhenRender = {
    bcd,
    features,
    browserList,
    browsers,
    helper,
    featureConfig,
    selectedFeatures,
    selectedBrowsers,
    submitted: true,
    warnings
  };

  return controllers[responseType](data);
}