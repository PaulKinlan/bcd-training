import {html, render} from 'https://unpkg.com/lit-html?module';

onload = () => {
  const versionEl = document.getElementById("version");
  const versions = [ ...Array(104).keys() ];

  render(html`${versions.map((item) => html`<option value=${item}>${item}</option>`)}`, versionEl);

  versionEl.onchange = async (e) => {
    const version = e.target.value;
    const versionResponse = await fetch(`/api/features?version=${version}`);
    const versionData = await versionResponse.json();
    console.log(versionData)

    const enabled = versionData["Enabled by default"]
    const removed = versionData["Removed"]

    const output = `
    <h2>Enabled by default</h2>
    ${enabled.forEach(item=>'hello')}
    `

    render(myTemplate('World'), document.body);

  };
};