import { html, render } from 'https://unpkg.com/lit-html?module';

onload = () => {
  const versionEl = document.getElementById("version");
  const outputEl = document.getElementById("output");
  const versions = [...Array(104).keys()].reverse();

  render(html`${versions.map((item) => html`<option value=${item}>${item}</option>`)}`, versionEl);

  versionEl.onchange = async (e) => {
    const version = e.target.value;
    if (version == undefined) return;


    const versionResponse = await fetch(`/api/features?version=${version}`);
    const versionData = await versionResponse.json();

    const featuresByType = versionData.features_by_type;

    const enabled = featuresByType["Enabled by default"];
    const removed = featuresByType["Removed"];

    render(html`
    <h2>Enabled by default in ${version}</h2>
    <p>This realease of Chrome had ${versionData.total_count} new features</p>
    ${enabled.map(item =>
      html`<h3>${item.name}</h3>
      <p>${item.summary} <a href=${item.launch_bug_url}>#</a></p>
      <p>${item.creator} created this feature because <blockquote>${item.motivation}</blockquote></p>
      <p>This feature was initially propose in <a href=${item.initial_public_proposal_url}>${item.initial_public_proposal_url}</a></p>
      <p>This feature is in "<a href=${item.standards.spec}>${item.standards.status.text}</a>"
      <h3>Resources</h3>
      ${('docs' in item.resources) ? html`<p>Docs: ${item.resources.docs.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked docs`}</p>
      ${('samples' in item.resources) ? html`<p>Samples: ${item.resources.samples.map(resource => html`<a href=${resource}>${resource}</a>`)}</p>` : html`No linked samples`}</p>`
    )}
      
    <h2>Removed in ${version} </h2>
    `, outputEl);
  };
};