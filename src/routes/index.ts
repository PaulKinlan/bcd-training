import template from "../flora.ts";
import data from "https://esm.sh/@mdn/browser-compat-data@latest/data.json"

export default function render(request: Request) : Response {
  return template`<html>

  <head>
	<title>Time to...</title>
	<link rel="stylesheet" href="/styles/default.css">
	<meta name="author" content="Paul Kinlan">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<link rel="author" href="https://paul.kinlan.me/">
  </head>
  <body>
    ${data.browsers}
	</body>
  </html>`
		.then(data => new Response(data, { status: 200, headers: { 'content-type': 'text/html' } }));
};