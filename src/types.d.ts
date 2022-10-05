import { BrowserName } from "https://esm.sh/@mdn/browser-compat-data@latest/types.d.ts";

export * from "https://esm.sh/@mdn/browser-compat-data@latest/types.d.ts";
export type ValidFeatures = 'api' | 'css' | 'html' | 'javascript';
export type CompatResult = {
  isStable: boolean;
  category: ValidFeatures | undefined;
  mdn_url: string | undefined;
  spec_url: string | string[] | undefined;
  api: string;
  firstDate: Date;
  firstBrowser: BrowserName;
  lastDate: Date;
  lastBrowser: BrowserName;
  age: number;
  ageInDays: number;
  browserSupport: BrowserName[];
};