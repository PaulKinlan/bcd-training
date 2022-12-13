import { Browsers, BrowserName } from "./types.d.ts";

export default class BrowsersHelper {
  #browsers: Browsers;
  constructor(browsers: Browsers) {
    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser: BrowserName, version: string): string | undefined => {
    // need to do something with "mirror"
    if (version in this.#browsers[browser].releases == false) return undefined;
    return this.#browsers[browser].releases[version].release_date;
  };

  getBrowserName = (browser: BrowserName) => {
    return this.#browsers[browser].name;
  };

  getBrowserNames = (selectedBrowsers: Set<BrowserName>) => {
    return [...selectedBrowsers.keys()].map((browser) =>
      this.#browsers[browser].name
    );
  };
}
