export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.hostname = "blockcertify.7973monugoswami.workers.dev";
    return fetch(new Request(url.toString(), request));
  }
};
