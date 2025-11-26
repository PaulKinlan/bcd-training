import template from "../../flora.ts";
import { WhenRender } from "../types.d.ts";

export default function render({ bcd, features }: WhenRender): Response {

  const { __meta } = bcd;

  return template`
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    <url>
      <loc>https://bcd-training.deno.dev/</loc>
      <lastmod>${__meta.timestamp}</lastmod>
    </url>
  ${features.map(feature => template`
    <url>
      <loc>https://bcd-training.deno.dev/feature?id=${feature.api}</loc>
      <lastmod>${__meta.timestamp}</lastmod>
    </url>`
  )}
  </urlset>`
    .then(data => new Response(data, { status: 200, headers: { 'content-type': 'application/xml' } }));
}