import { WhenRender } from "../types.d.ts";

export default function render({ }: WhenRender): Response {
  return new Response("Not found", { status: 404 });
}