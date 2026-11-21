export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.hostname = "blockcertify.7973monugoswami.workers.dev";
    url.port = "";

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("X-Forwarded-Host", "blockcertify.pages.dev");
    headers.set("X-Forwarded-Proto", "https");

    const init = {
      method: request.method,
      headers: headers,
      redirect: "manual"
    };

    if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
      init.body = request.body;
      init.duplex = "half";
    }

    try {
      const response = await fetch(url.toString(), init);
      const resHeaders = new Headers(response.headers);
      const loc = resHeaders.get("Location") || resHeaders.get("location");
      if (loc && loc.includes("blockcertify.7973monugoswami.workers.dev")) {
        resHeaders.set("Location", loc.replace("blockcertify.7973monugoswami.workers.dev", "blockcertify.pages.dev"));
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders
      });
    } catch (err) {
      return new Response("Bridge error: " + (err.message || err), { status: 502 });
    }
  }
};
