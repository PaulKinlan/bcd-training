import { BrowserName, StatusBlock } from "https://esm.sh/@mdn/browser-compat-data@latest/types.d.ts";
import { BrowserState } from "./routes/types.d.ts";

export * from "https://esm.sh/@mdn/browser-compat-data@latest/types.d.ts";
export type ValidFeatures = 'api' | 'css' | 'html' | 'javascript';
export type BrowserDate = { browser: BrowserName, added: Date };


export type FeatureStats = {
  isStable: boolean;
  isRemoved: boolean;
  first: BrowserDate;
  last: BrowserDate;
  age: number;
  ageInDays: number;
  browsers: BrowserName[];
}

export type CompatResult = {
  category: ValidFeatures | undefined;
  mdn_url: string | undefined;
  spec_url: string | string[] | undefined;
  status: StatusBlock;
  api: string;
  first: FeatureStats;
  last: FeatureStats;
  all: BrowserState;
  stableStats: FeatureStats;
  removedStats: FeatureStats;
};