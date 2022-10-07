import { CompatStatement, Browsers, BrowserName, Identifier, SupportStatement, CompatResult, SimpleSupportStatement } from "./types.d.ts";

type Feature = [string, Identifier | CompatStatement, string | undefined]
type BrowserDate = { browser: BrowserName, added: Date };


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

/*
 Gets Features that are not in preview and if they are stable or not.
*/
export const getFeatures = (browsers: Browsers, mustBeIn: Set<BrowserName>, data: Identifier | CompatStatement): CompatResult[] => {
  const output = [];
  for (const [api, compat, root] of itterateFeatures(data)) {
    if ("__compat" in compat) {
      const dates: BrowserDate[] = [];
      const browserSupport: BrowserName[] = [];
      let isStable = false;
      const mdn_url = compat.__compat?.mdn_url;
      const spec_url = compat.__compat?.spec_url;
      let browser: keyof Partial<Record<BrowserName, SupportStatement>>;
      for (browser in compat.__compat?.support) {
        let supportStatment = compat.__compat?.support[browser];
        let support: SimpleSupportStatement;
        if (supportStatment == undefined) continue;
        if (mustBeIn.has(browser) == false) continue; // skip if we are not looking for this browser

        if ("version_added" in supportStatment === false && Array.isArray(supportStatment)) {
          support = supportStatment[0]; // Smash in the first answer for now because it is the most recent.
        } else {
          support = <SimpleSupportStatement>supportStatment;
        }

        let { version_added } = support;
        if (typeof(version_added) === 'string' && version_added.startsWith("≤") === true) {
          // Assume the value of "equal" and continue.
          version_added = version_added.replace("≤","");
        }

        if (
            version_added === true || (
            ("flags" in support == false) && // Flagged API's are not stable.
            support.version_added !== false &&
            support.version_added != null &&
            support.version_added != "preview")
        ) {
          let browserKey: BrowserName | undefined = browser;
        
          if (version_added == "mirror") {
            browserKey = browsers[browser].upstream;
          }

          if (browserKey == undefined) {
            console.log(browserKey, support); // Log this case.
            continue; // Skip if there is an issue.
          }

          if (version_added === true) {
            // Get the first listed entry.
            console.log("Browser Version 'True'", Object.keys(browsers[browserKey].releases)[0], api, browserKey);
            version_added = Object.keys(browsers[browserKey].releases)[0];
          }

          const dateAddedInBrowser =
            browsers[browserKey].releases[version_added].release_date;

          if (dateAddedInBrowser != undefined) {
            // Only add if there is a release date, this captures Betas (i.e, Safari)
            dates.push({
              browser: browser,
              added: new Date(dateAddedInBrowser),
            });
            browserSupport.push(browser);
          }

          // Only stable if in all 'mustBeIn'
          if (
            [...mustBeIn].every((d) => browserSupport.indexOf(d) >= 0) == true
          ) {
            isStable = true;
          }
        }
      }

      if (dates.length == 0) continue; // we cant work out if its in a browser due to weird data.

      // Order the data so we can pick out the first and last.
      dates.sort(function (a, b) {
        return a.added - b.added;
      });

      const [earliest, latest] = [dates[0], dates[dates.length - 1]];
      const age = latest.added - earliest.added;
      const ageInDays = age / (1000 * 60 * 60 * 24);
      const newLocal: CompatResult = {
        isStable,
        category: root,
        mdn_url,
        spec_url,
        api,
        firstDate: earliest.added,
        firstBrowser: earliest.browser,
        lastDate: latest.added,
        lastBrowser: latest.browser,
        age,
        ageInDays,
        browserSupport
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
  return getFeatures(browsers, mustBeIn, data).filter(feature => feature.isStable);
};
