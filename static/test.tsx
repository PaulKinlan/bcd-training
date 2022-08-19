import { Fragment, h, renderToString } from "https://deno.land/x/jsx/mod.ts";

// Only functional components are supported
function HelloWorld({ name }: {name: string}) {
  return <h1>Hello {name}!</h1>;
}

// However, the components may be asynchronous
async function File({ path }: { path: string }) {
  return <p>{path}</p>;
}

const html = await renderToString(
  <>
    <HelloWorld name="Deno" />
    <File path="README.txt" />
  </>
);