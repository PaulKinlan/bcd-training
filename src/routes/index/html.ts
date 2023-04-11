import template from "../../flora.ts";
import { WhenRender } from "../types.d.ts";
import renderFooter from "../ui-components/footer.ts";

export default function render({ bcd, features, browserList }: WhenRender): Response {


  const { __meta } = bcd

  return template`<html>

  <head>
	<title>A list of all browser features and a link to their compat data</title>
  <link rel="stylesheet" href="/styles/water.css">
	<meta name="author" content="Paul Kinlan">
  <meta charset="UTF-8">
  <meta name="description" content="A list of features that are considered "Experimental" for ${browserList} and when the landed in the first browser and the last">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <link rel="shortcut icon" href="/images/favicon.png">
	<link rel="author" href="https://paul.kinlan.me/">
  <style>
  form span.warning {
    color: red;
  }

  </style>
  </head>
  <body>
    <header>
      <h1>All APIs</h1>
    </header>

    <ul>
    ${features.map(feature => template`<li><a href="/feature?id=${feature.api}">${feature.api}</a></li>`
  )}
    </ul>

    ${renderFooter(__meta)}
    </body>
  </html>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
}