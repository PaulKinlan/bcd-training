import BrowsersHelper from "./browser.ts";
import { CompatStatement, Browsers, BrowserDate, BrowserName, Identifier, SupportStatement, CompatResult, SimpleSupportStatement, FeatureStats } from "./types.d.ts";

type Feature = [string, Identifier | CompatStatement, string | undefined]

function* itterateFeatures(data: Identifier | CompatStatement, parent?: string, root?: string): Generator<Feature> {
  for (const [topLevelAPI, information] of Object.entries(data)) {
    if (topLevelAPI.startsWith("__")) {
      continue;
    }
    const newRoot: string | undefined | null = (root == "" || root == undefined) ? topLevelAPI : root;

    let namespaceAPI = "";
    if (root == "") {
      namespaceAPI = "";
    } else {
      if (parent == "" || parent == undefined) {
        namespaceAPI = topLevelAPI;
      } else {
        namespaceAPI = `${parent}.${topLevelAPI}`;
      }
    }

    yield [namespaceAPI, information, newRoot];
    // Recurse
    yield* itterateFeatures(information, namespaceAPI, newRoot);
  }
}

const isFeatureRemoved = (featureSupport: CompatStatement["support"], browsers: Browsers, mustBeIn: Set<BrowserName>): FeatureStats | null => {
  const datesRemoved: BrowserDate[] = [];
  const browserStableSupport: BrowserName[] = [];
  let support: SimpleSupportStatement;
  let isRemoved = false;

  let browser: keyof Partial<Record<BrowserName, SupportStatement>>;

  for (browser in featureSupport) {
    let supportStatement = featureSupport[browser];

    if (supportStatement && "version_removed" in supportStatement === false && Array.isArray(supportStatement)) {
      support = supportStatement[0]; // Smash in the first answer for now because it is the most recent.
    } else {
      support = <SimpleSupportStatement>supportStatement;
    }

    if (support == undefined) {
      continue;
    }

    if (mustBeIn.has(browser) == false) {
      continue;
    } // skip if we are not looking for this browser

    let { version_removed } = support;
    let browserKey: BrowserName | undefined = browser;

    if (typeof (version_removed) === 'string' && version_removed.startsWith("≤") === true) {
      // Assume the value of "equal" and continue.
      version_removed = version_removed.replace("≤", "");
    }
    if (version_removed == undefined || version_removed == null || version_removed == "preview" || version_removed == false) {
      continue;
    }

    if (version_removed == "mirror") {
      browserKey = browsers[browser].upstream;
    }

    if (browserKey == undefined) {
      console.log(browserKey, support); // Log this case.
      continue
    }

    if (version_removed === true) {
      // Get the first listed entry.
      version_removed = Object.keys(browsers[browserKey].releases)[0];
    }

    const dateRemovedInBrowser =
      browsers[browserKey].releases[version_removed].release_date;

    if (dateRemovedInBrowser != undefined) {
      // Only add if there is a release date, this captures Betas (i.e, Safari)

      datesRemoved.push({
        browser,
        added: new Date(dateRemovedInBrowser),
      });
      browserStableSupport.push(browser);
    }
  }
  // Only stable if in all 'mustBeIn'
  isRemoved = [...mustBeIn].every((d) => browserStableSupport.indexOf(d) >= 0);

  if (datesRemoved.length == 0) return null; // we cant work out if its in a browser due to weird data.

  // Order the data so we can pick out the first and last.
  datesRemoved.sort(function (a, b) {
    return a.added - b.added;
  });

  const [first, last] = [datesRemoved[0], datesRemoved.at(-1)];
  const age = Date.now() - first.added;
  const ageInDays = age / (1000 * 60 * 60 * 24);

  return {
    age,
    ageInDays,
    first,
    last,
    isStable: false,
    isRemoved,
    browsers: browserStableSupport
  }
}

const isFeatureStable = (featureSupport: CompatStatement["support"], browsers: Browsers, mustBeIn: Set<BrowserName>): FeatureStats | null => {

  const datesAdded: BrowserDate[] = [];
  const browserStableSupport: BrowserName[] = [];
  let support: SimpleSupportStatement;
  let isStable = false;

  let browser: keyof Partial<Record<BrowserName, SupportStatement>>;

  for (browser in featureSupport) {
    let supportStatement = featureSupport[browser];

    if (supportStatement && "version_added" in supportStatement === false && Array.isArray(supportStatement)) {
      support = supportStatement[0]; // Smash in the first answer for now because it is the most recent.
    } else {
      support = <SimpleSupportStatement>supportStatement;
    }

    if (support == undefined) {
      continue;
    }

    if (mustBeIn.has(browser) == false) {
      continue;
    } // skip if we are not looking for this browser

    let { version_added, version_removed } = support;
    let browserKey: BrowserName | undefined = browser;

    if (typeof (version_added) === 'string' && version_added.startsWith("≤") === true) {
      // Assume the value of "equal" and continue.
      version_added = version_added.replace("≤", "");
    }
    if (version_added == undefined || version_added == null || version_added == "preview" || version_added == false) {
      continue;
    }

    if (version_added == "mirror") {
      browserKey = browsers[browser].upstream;
    }

    if (browserKey == undefined) {
      console.log(browserKey, support); // Log this case.
      continue
    }

    if (version_added === true) {
      // Get the first listed entry.
      version_added = Object.keys(browsers[browserKey].releases)[0];
    }

    if (version_removed != undefined) {
      // It was removed from this browser.
      continue;
    }

    const dateAddedInBrowser =
      browsers[browserKey].releases[version_added].release_date;

    if (dateAddedInBrowser != undefined) {
      // Only add if there is a release date, this captures Betas (i.e, Safari)

      datesAdded.push({
        browser,
        added: new Date(dateAddedInBrowser),
      });
      browserStableSupport.push(browser);
    }
  }

  // Only stable if in all 'mustBeIn'
  isStable = [...mustBeIn].every((d) => browserStableSupport.indexOf(d) >= 0);

  if (datesAdded.length == 0) return null; // we cant work out if its in a browser due to weird data.

  // Order the data so we can pick out the first and last.
  datesAdded.sort(function (a, b) {
    return a.added - b.added;
  });

  const [first, last] = [datesAdded[0], datesAdded.length > 1 ? datesAdded[datesAdded.length - 1] : null];
  const age = (last?.added || Date.now()) - first.added;
  const ageInDays = age / (1000 * 60 * 60 * 24);

  return {
    age,
    ageInDays,
    first,
    last,
    isStable,
    isRemoved: false,
    browsers: browserStableSupport
  }
};

const getFeatureSupport = (featureSupport: CompatStatement["support"], browsers: Browsers, mustBeIn: Set<BrowserName>): BrowserState[] => {
  let support: SimpleSupportStatement;
  let browserState: BrowserState = {};

  let browser: keyof Partial<Record<BrowserName, SupportStatement>>;

  for (browser in featureSupport) {
    let supportStatement = featureSupport[browser];

    if (supportStatement && "version_removed" in supportStatement === false && Array.isArray(supportStatement)) {
      support = supportStatement[0]; // Smash in the first answer for now because it is the most recent.
    } else {
      support = <SimpleSupportStatement>supportStatement;
    }

    if (support == undefined) {
      continue;
    }

    let { version_removed, version_added } = support;
    let browserKey: BrowserName | undefined = browser;

    if (typeof (version_removed) === 'string' && version_removed.startsWith("≤") === true) {
      // Assume the value of "equal" and continue.
      version_removed = version_removed.replace("≤", "");
    }

    if (typeof (version_added) === 'string' && version_added.startsWith("≤") === true) {
      // Assume the value of "equal" and continue.
      version_added = version_added.replace("≤", "");
    }

    if (version_removed == "mirror") {
      browserKey = browsers[browser].upstream;
    }

    if (browserKey == undefined) {
      console.log(browserKey, support); // Log this case.
      continue;
    }

    if (browserKey in browserState == false) {
      browserState[browserKey] = {}
    }

    browserState[browserKey].name = browsers[browserKey].name;

    if (version_removed in browsers[browserKey].releases) {
      browserState[browserKey].version_removed = version_removed;
      browserState[browserKey].date_removed = browsers[browserKey].releases[version_removed].release_date;
    }

    if (version_added in browsers[browserKey].releases) {
      browserState[browserKey].version_added = version_added;
      browserState[browserKey].date_added = browsers[browserKey].releases[version_added].release_date;
    }
  }

  return browserState;
}

/*
 Gets Features that are not in preview and if they are stable or not.
*/
export const getFeatures = (browsers: Browsers, mustBeIn: Set<BrowserName>, data: Identifier | CompatStatement): CompatResult[] => {
  const output = [];
  for (const [api, compat, root] of itterateFeatures(data)) {
    if ("__compat" in compat) {
      const status = compat.__compat?.status;
      const mdn_url = compat.__compat?.mdn_url;
      const spec_url = compat.__compat?.spec_url;

      const stableStats = isFeatureStable(compat.__compat?.support, browsers, mustBeIn);
      const removedStats = isFeatureRemoved(compat.__compat?.support, browsers, mustBeIn);
      const all = getFeatureSupport(compat.__compat?.support, browsers, mustBeIn);

      const newLocal: CompatResult = {
        category: root,
        status,
        mdn_url,
        spec_url,
        api,
        all,
        stableStats,
        removedStats
      };
      output.push(newLocal);
    }
  }
  return output;
}

/*
  Gets only the stable features.
*/
export const getStableFeatures = (browsers: Browsers, mustBeIn: Set<BrowserName>, data: Identifier | CompatStatement): CompatResult[] => {
  return getFeatures(browsers, mustBeIn, data).filter(feature => feature.stableStats?.isStable);
};
