import BrowsersHelper from "../browser.ts";
import { BrowserDate, BrowserName, Browsers, CompatData, CompatResult, SimpleSupportStatement, ValidFeatures } from "../types.d.ts";

export type FeatureConfig = { [K in ValidFeatures]: { name: string } };

export type ResponseType = 'csv' | 'html'| 'rss';

export type BrowserState = Partial<Record<BrowserName, SimpleSupportStatement & { date_added: BrowserDate; date_removed: BrowserDate, name: string }>>

type WhenRender = {
  bcd: CompatData,
  browsers: Browsers,
  helper: BrowsersHelper,
  browserList: string,
  selectedBrowsers: Set<BrowserName>,
  selectedFeatures: Set<ValidFeatures>,
  features: CompatResult[],
  all: BrowserState,
  featureConfig: FeatureConfig,
  warnings: string[],
  submitted: boolean
}
