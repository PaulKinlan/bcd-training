import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";


class StripStream extends TransformStream {
  constructor() {

    let parsedFirstChunk: boolean = false;
    super({
      transform(chunk, controller) {
        if (parsedFirstChunk == false) {
          // 41,  93, 125,  39, 10 == ")]}'\n"
          chunk[0] = 0;
          chunk[1] = 0;
          chunk[2] = 0;
          chunk[3] = 0;

          controller.enqueue(chunk);
          parsedFirstChunk = true;
        }
        else {
          controller.enqueue(chunk);
        }
      }
    })
  }
}

const api = new Router();

api.get("/api/features", (ctx) => {
  const version = new URL(ctx.request.url).searchParams.get("version") || 100;
  const featuresResponse = fetch(`https://chromestatus.com/api/v0/features?milestone=${version}`);
  ctx.response = featuresResponse.then(response => new Response(response.body.pipeThrough(new StripStream())));
})


const app = new Application();

app.use(api.routes())
  .use(async (context, next) => {
    try {
      await context.send({
        root: `${Deno.cwd()}/static`,
        index: "index.html",
      });
    } catch {
      await next();
    }
  })
  .listen({ port: 8000 });

// serve((req: Request) => {
//   const version = new URL(req.url).searchParams.get("version") || 100;
//   const featuresResponse = fetch(`https://chromestatus.com/api/v0/features?milestone=${version}`);
//   return featuresResponse.then(response => new Response(response.body.pipeThrough(new StripStream())));
// });
