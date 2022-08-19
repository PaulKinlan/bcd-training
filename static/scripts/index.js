onload = () => {
  const versionEl = document.getElementById("version");

  versionEl.onchange = async (e) => {
    const version = e.target.value;
    const versionResponse = await fetch(`/api/features?version=${version}`);
    const versionData = await versionResponse.json();
    console.log(versionData)
  };
};