import { CompatData } from "../types.d.ts";
import { getFeatures } from "../bcd.ts";
import BrowsersHelper from "../browser.ts";
import { parseResponse, parseSelectedBrowsers, parseSelectedFeatures } from "./_utils/request.ts";
import { FeatureConfig, WhenRender } from "./types.d.ts";

import xmlRender from './sitemap/xml.ts';

const controllers = {
  'xml': xmlRender
}

export default function render(request: Request, bcd: CompatData): Response {

  const { browsers } = bcd;
  const featureConfig: FeatureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JS" } };

  const warnings = new Array<string>();
  const helper = new BrowsersHelper(browsers);

  const selectedBrowsers = helper.getBrowserIds();
  const responseType = 'xml';

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  const browserList = formatter.format(helper.getAllBrowserNames());

  const selectedFeatures = new Set(['api', 'css', 'javascript', 'html']);
  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));
  const features = getFeatures(browsers, selectedBrowsers, filteredData);

  const data: WhenRender = {
    bcd,
    features,
    browserList,
    browsers,
    helper,
    featureConfig,
    selectedFeatures: null,
    selectedBrowsers,
    submitted: null,
    warnings
  };

  console.log('responseType', responseType)
  return controllers[responseType](data);
}