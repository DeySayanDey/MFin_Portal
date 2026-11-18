import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const url = env.match(/^SUPPORT_API_URL=(.*)$/m)[1].replace(/\/$/, "");
const key = env.match(/^SUPPORT_API_KEY=(.*)$/m)[1];
const queries = [
  "?phone=7741258963",
  "?phone=7741258963&domain=localhost:3000",
  "?customerPhone=7741258963&domain=localhost:3000",
];

for (const query of queries) {
  const response = await fetch(`${url}/integrations/redirect/tickets/token${query}`, {
    headers: { Accept: "application/json", "X-Api-Key": key },
  });
  const text = await response.text();
  const safe = text
    .replace(/"(accessToken|token|access_token)"\s*:\s*"[^"]+"/g, '"$1":"[redacted]"')
    .slice(0, 400);
  console.log(response.status, query, safe);
}
