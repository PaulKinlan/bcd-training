import { getFeatures } from "../bcd.ts";
import BrowsersHelper from "../browser.ts";
import { CompatData, FeatureConfig } from "./types.d.ts";

import htmlRender from './feature/html.ts';

export default function render(request: Request, bcd: CompatData): Response {

  const url = new URL(request.url);
  const { browsers } = bcd;
  const featureConfig: FeatureConfig = { 'api': { name: "DOM API" }, 'css': { name: "CSS" }, 'html': { name: "HTML" }, 'javascript': { name: "JS" } };

  const featureName = url.searchParams.get('id');

  const helper = new BrowsersHelper(browsers);

  const selectedBrowsers = helper.getBrowserIds();
  const selectedFeatures = new Set(['api', 'css', 'javascript', 'html']);

  // Formatter that we will use a couple of times.
  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
  const browserList = formatter.format(helper.getBrowserNames(selectedBrowsers));

  const filteredData = Object.fromEntries(Object.entries(bcd).filter(([key]) => selectedFeatures.has(key)));

  const features = getFeatures(browsers, selectedBrowsers, filteredData);

  const data  = {
    bcd,
    features,
    browserList,
    helper,
    featureName
  };

  return htmlRender(data);
}