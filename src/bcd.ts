
function* itterateFeatures(data, parent = "", root = "") {
  for (let [topLevelAPI, information] of Object.entries(data)) {
    if (topLevelAPI.startsWith("__")) {
      continue;
    }
    let newRoot = (root == "") ? topLevelAPI : root;

    let namespaceAPI = "";
    if (root == "") {
      namespaceAPI = "";
    }
    else {
      if (parent == "") {
        namespaceAPI = topLevelAPI;
      }
      else {
        namespaceAPI = `${parent}.${topLevelAPI}`;
      }
    }

    yield [namespaceAPI, information, newRoot];
    // Recurse
    yield* itterateFeatures(information, namespaceAPI, newRoot);
  }
}

export const getStableFeatures = (browsers, mustBeIn: Set, data) => {
  const output = [];
  for (let [api, compat, root] of itterateFeatures(data)) {
    if ("__compat" in compat) {
      const dates = [];
      const browserSupport = [];
      let isStable = false;
      let { mdn_url } = compat.__compat;
      for (let [browser, support] of Object.entries(compat.__compat.support)) {
        if (mustBeIn.has(browser) == false) continue; // skip if we are not looking for this browser

        if ("version_added" in support === false && Array.isArray(support)) {
          support = support[0] // Smash in the first answer for now.
        }


        if (
          "version_added" in support &&
          ("flags" in support == false) && // Flagged API's are not stable.
          support.version_added !== false &&
          support.version_added != null &&
          support.version_added !== true &&
          support.version_added != "preview" &&
          support.version_added.startsWith("≤") === false
        ) {

          let browserKey = browser;

          if (support.version_added == "mirror") {
            browserKey = browsers[browser].upstream;
          }

          const dateAddedInBrowser = browsers[browserKey].releases[support.version_added].release_date

          if (!!dateAddedInBrowser) {
            // Only add if there is a releaes date, this captures Betas (i.e, Safari)
            dates.push({ browser: browser, added: new Date(dateAddedInBrowser) });
            browserSupport.push(browser);
          }

          // Only stable if in all 'mustBeIn'
          if ([...mustBeIn].every((d) => browserSupport.indexOf(d) >= 0) == true) {
            isStable = true;
          }
        }
      }

      if (isStable == false) continue; // Not stable, skip.

      if (dates.length == 0) continue; // we cant work out if its in a a brower due to weird data.

      // Order the data so we can pick out the first and last.
      dates.sort(function (a, b) {
        return a.added - b.added;
      });

      const [earliest, latest] = [dates[0], dates[dates.length - 1]];
      const age = latest.added - earliest.added;
      const ageInDays = age / (1000 * 60 * 60 * 24);
      output.push({
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
      });
    }
  }
  return output;
}
