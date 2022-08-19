export class StripStream extends TransformStream {
    constructor() {
  
      let parsedFirstChunk: boolean = false;
      super({
        transform(chunk, controller) {
          if (parsedFirstChunk == false) {
            // 41,  93, 125,  39, 10 == ")]}'\n"
            controller.enqueue(chunk.slice(4));
            parsedFirstChunk = true;
          }
          else {
            controller.enqueue(chunk);
          }
        }
      })
    }
  }