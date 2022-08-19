import { serve } from "https://deno.land/std@0.145.0/http/server.ts";

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

serve((req: Request) => {
  const version = new URL(req.url).searchParams.get("version") || 100;

  const featuresResponse = fetch(`https://chromestatus.com/api/v0/features?milestone=${version}`);

  return featuresResponse.then(response => new Response(response.body.pipeThrough(new StripStream())));
});
