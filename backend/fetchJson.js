import { request } from 'https';

export async function fetchJson(req, payload) {
  return new Promise((res, rej) =>
    request(
      req,
      (r) => {
        let body = "";
        r.on("data", (chunk) => (body += chunk));
        r.on("end", () => {
          if (r.statusCode !== 200) return rej(body);
          try {
            res(JSON.parse(body));
          } catch (error) {
            rej(error);
          }
        });
      }
    )
      .on("error", rej)
      .end(payload)
  );
}
