import { html, render } from 'https://unpkg.com/lit-html?module';

onload = () => {
  const versionEl = document.getElementById("version");
  const outputEl = document.getElementById("output");
  const versions = [...Array(107).keys()].reverse();

  render(html`${versions.map((item) => html`<option value=${item}>${item}</option>`)}`, versionEl);

  versionEl.onchange = async (e) => {
    const version = e.target.value;
    if (version == undefined) return;


    const versionResponse = await fetch(`/api/features?version=${version}`);
    const versionData = await versionResponse.json();

    const featuresByType = versionData.features_by_type;

    const enabled = featuresByType["Enabled by default"];
    const originTrials = featuresByType["Origin trial"];
    const flaggedFeatures = featuresByType["In developer trial (Behind a flag)"];
    const removed = featuresByType["Removed"];

    render(html`
    <h1>Chrome ${version}</h1>
    ${renderEnabled(enabled, version, versionData)}
    ${renderOriginTrials(originTrials, version, versionData)}
    ${renderFlaggedFeatures(flaggedFeatures, version, versionData)}
    `, outputEl);
  };
};

const renderEnabled = (enabled, version, versionData) => html`
    <h2>Enabled by default in ${version}</h2>
    <p>This realease of Chrome had ${versionData.total_count} new features.</p>
    ${enabled.map(item =>
  html`<h3>${item.name}</h3>
      <p>${item.summary} <a href=${item.launch_bug_url}>#</a></p>
      ${('motivation' in item) ? html`<p>${item.creator} created this feature because: <blockquote>${item.motivation}</blockquote></p>` : html``}
      <p>This feature was initially propose in <a href=${item.initial_public_proposal_url}>${item.initial_public_proposal_url}</a></p>
      <p>This feature is in "<a href=${item.standards.spec}>${item.standards.status.text}</a>"
      <h4>Resources</h4>
      ${('docs' in item.resources) ? html`<p>Docs: ${item.resources.docs.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked docs`}</p>
      ${('samples' in item.resources) ? html`<p>Samples: ${item.resources.samples.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked samples`}</p>`
)}`;

const renderOriginTrials = (enabled, version, versionData) => html`
    <h2>Origin Trials in-progress in ${version}</h2>
    <p>This realease of Chrome had ${versionData.total_count} new origin trials.</p>
    ${enabled.map(item =>
  html`<h3>${item.name}</h3>
      <p>${item.summary} <a href=${item.launch_bug_url}>#</a></p>
      ${('motivation' in item) ? html`<p>${item.creator} created this feature because: <blockquote>${item.motivation}</blockquote></p>` : html``}
      <p>This feature was initially propose in <a href=${item.initial_public_proposal_url}>${item.initial_public_proposal_url}</a></p>
      <p>This feature is in "<a href=${item.standards.spec}>${item.standards.status.text}</a>"
      <h4>Resources</h4>
      ${('docs' in item.resources) ? html`<p>Docs: ${item.resources.docs.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked docs`}</p>
      ${('samples' in item.resources) ? html`<p>Samples: ${item.resources.samples.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked samples`}</p>`
)}`;

const renderFlaggedFeatures = (enabled, version, versionData) => html`
    <h2>Flagged features in ${version}</h2>
    <p>This realease of Chrome had ${versionData.total_count} are available behind a flag.</p>
    ${enabled.map(item =>
  html`<h3>${item.name}</h3>
      <p>${item.summary} <a href=${item.launch_bug_url}>#</a></p>
      ${('motivation' in item) ? html`<p>${item.creator} created this feature because: <blockquote>${item.motivation}</blockquote></p>` : html``}
      <p>This feature was initially propose in <a href=${item.initial_public_proposal_url}>${item.initial_public_proposal_url}</a></p>
      <p>This feature is in "<a href=${item.standards.spec}>${item.standards.status.text}</a>"
      <h4>Resources</h4>
      ${('docs' in item.resources) ? html`<p>Docs: ${item.resources.docs.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked docs`}</p>
      ${('samples' in item.resources) ? html`<p>Samples: ${item.resources.samples.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked samples`}</p>`
)}`;