import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import { join } from "https://deno.land/std@0.152.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.152.0/media_types/mod.ts";

import bcd from "https://esm.sh/@mdn/browser-compat-data@latest/data.json" assert {
  type: "json",
};

import { Route } from "./src/types.ts";
import { StripStream } from "./src/stream-utils.ts";

import index from "./src/routes/index.ts";
import when from "./src/routes/when.ts";

// Init

delete bcd.webextensions;
delete bcd.webdriver;
delete bcd.svg;
delete bcd.mathml;

class StaticFileHandler {
  #basePath: string = "";

  constructor(base: string) {
    this.#basePath = base;
  }

  handler(request: Request): Response {
    const pathname = new URL(request.url).pathname;
    const extension = pathname.substr(pathname.lastIndexOf("."));
    const resolvedPathname = (pathname == "" || pathname == "/")
      ? "/index.html"
      : pathname;
    const path = join(Deno.cwd(), this.#basePath, resolvedPathname);
    const file = Deno.readFile(path)
      .then((data) =>
        new Response(data, {
          status: 200,
          headers: { "content-type": contentType(extension) },
        })
      ) // Need to think about content tyoes.
      .catch((_) => new Response("Not found", { status: 404 }));

    return file;
  }

  get pattern(): URLPattern {
    return new URLPattern({ pathname: "*" });
  }
}

serve((req: Request) => {
  const url = req.url;
  const staticFiles = new StaticFileHandler("static");
  let response: Response = new Response(
    new Response("Not found", { status: 404 }),
  );

  const routes: Array<Route> = [
    [
      new URLPattern({ pathname: "/" }),
      (request) => {
        return index(request, bcd);
      },
    ],
    [
      new URLPattern({ pathname: "/when-stable" }),
      (request) => {
        return when(request, bcd);
      },
    ],
    // Fall through.
    [
      staticFiles.pattern,
      staticFiles.handler.bind(staticFiles),
    ],
  ];

  for (const [pattern, handler] of routes) {
    const patternResult = pattern.exec(url);
    if (patternResult != null) {
      // Find the first matching route.
      response = handler(req, patternResult);
      break;
    }
  }

  return response;
});
