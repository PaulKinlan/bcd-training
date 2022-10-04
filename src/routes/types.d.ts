import BrowsersHelper from "../browser.ts";
import { BrowserName, Browsers, CompatData, ValidFeatures } from "../types.d.ts";

export type FeatureConfig = { [K in ValidFeatures]: { name: string } }
export type ResponseType = 'rss' | 'html';

type WhenRender = {
  bcd: CompatData,
  browsers: Browsers,
  helper: BrowsersHelper,
  browserList: string,
  selectedBrowsers: Set<BrowserName>,
  selectedFeatures: Set<ValidFeatures>,
  stableFeatures: [],
  featureConfig: FeatureConfig,
  warnings: string[],
  submitted: boolean
}