import { html, render } from 'https://unpkg.com/lit-html?module';

onload = () => {
  const versionEl = document.getElementById("version");
  const outputEl = document.getElementById("output");
  const versions = [...Array(104).keys()].reverse();

  render(html`${versions.map((item) => html`<option value=${item}>${item}</option>`)}`, versionEl);

  versionEl.onchange = async (e) => {
    const version = e.target.value;
    const versionResponse = await fetch(`/api/features?version=${version}`);
    const versionData = await versionResponse.json();
    console.log(versionData)

    const enabled = versionData["Enabled by default"]
    const removed = versionData["Removed"]

    render(html`
    <h2>Enabled by default in ${version}</h2>
    ${enabled.map(item => html`<h3>${item.summary}</h3>`)}
    <h2>Removed in ${version} </h2>
    `, outputEl);
  };
};