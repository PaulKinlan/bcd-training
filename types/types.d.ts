export type Route = [URLPattern, RequestHandler];
export type RequestHandler = (Request) => Response | Promise<Response>;
