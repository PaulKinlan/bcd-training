import { serve } from "https://deno.land/std@0.145.0/http/server.ts";


class StripStream extends TransformStream {



    constructor() {

        let parsedFirstChunk: boolean = false;
        console.log("constuctor")
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

serve(async (req: Request) => {
    const version = new URL(req.url).searchParams.get("version") || 100;

    const response = await fetch(`https://chromestatus.com/api/v0/features?milestone=${version}`);

    return new Response(response.body.pipeThrough(new StripStream()));
});
