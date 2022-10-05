import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import { join } from "https://deno.land/std@0.152.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.152.0/media_types/mod.ts";

// @deno-types="https://esm.sh/@mdn/browser-compat-data@latest/types.d.ts"
import bcd from "https://esm.sh/@mdn/browser-compat-data@latest";

import index from "./src/routes/index.ts";
import notStable from "./src/routes/not-stable.ts";
import when from "./src/routes/when.ts";
import { Route } from "./types/types.d.ts";
// Init

delete bcd.webextensions;
delete bcd.webdriver;
delete bcd.svg;
delete bcd.mathml;


class StaticFileHandler {
  #basePath = "";

  constructor(base: string) {
    this.#basePath = base;
  }

  handler(request: Request): Promise<Response> | Response {
    const pathname = new URL(request.url).pathname;
    const extension = pathname.substr(pathname.lastIndexOf("."));
    const resolvedPathname = (pathname == "" || pathname == "/")
      ? "/index.html"
      : pathname;
    const path = join(Deno.cwd(), this.#basePath, resolvedPathname);
    const file: Promise<Response> = Deno.readFile(path)
      .then((data) : Response=>
        new Response(data, {
          status: 200,
          headers: { "content-type": contentType(extension) },
        })
      ) // Need to think about content tyoes.
      .catch((_) : Response => new Response("Not found", { status: 404 }));

    return file;
  }

  get pattern(): URLPattern {
    return new URLPattern({ pathname: "*" });
  }
}

serve((req: Request) => {
  const url = req.url;
  const staticFiles = new StaticFileHandler("static");
  let response: Response | Promise<Response> = new Response("Not found", { status: 404 });
    
  const routes: Array<Route> = [
    [
      new URLPattern({ pathname: "/" }),
      (request) => {
        return index(request, bcd);
      },
    ],
    [
      new URLPattern({ pathname: "/not-stable" }),
      (request) => {
        return notStable(request, bcd);
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
      response = handler(req);
      break;
    }
  }

  return response;
});
