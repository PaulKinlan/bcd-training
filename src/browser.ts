export default class Browsers {
  #browsers;
  constructor(browsers) {
    this.#browsers = browsers;
  }

  getBrowserReleaseDate = (browser, version): Set => {
    // need to do something with "mirror"
    return this.#browsers[browser].releases[version].release_date;
  }

  getBrowserName = (browser) => {
    return this.#browsers[browser].name;
  }

  getBrowserNames = (selectedBrowsers: Set) => {
    return [...selectedBrowsers.keys()].map(browser => this.#browsers[browser].name);
  }
}