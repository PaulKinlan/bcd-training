type Route = [URLPattern, RequestHandler];
type RequestHandler = (Request) => Response;