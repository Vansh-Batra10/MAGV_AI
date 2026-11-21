// k6 load test: 1,000 guests opening their links within 10 minutes (send burst), plus their open + RSVP calls.
// Run: k6 run -e BASE=http://localhost:3000 -e INVITE=demo -e GUEST=riyaFRND2 load/send-burst.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: { burst: { executor: "ramping-arrival-rate", startRate: 0, timeUnit: "1m", preAllocatedVUs: 60, maxVUs: 300,
    stages: [{ target: 200, duration: "2m" }, { target: 200, duration: "4m" }, { target: 0, duration: "4m" }] } },
  thresholds: { http_req_failed: ["rate<0.01"], "http_req_duration{page:guest}": ["p(95)<1500"], "http_req_duration{api:open}": ["p(95)<500"] },
};
const BASE = __ENV.BASE ?? "http://localhost:3000";
export default function () {
  const r = http.get(`${BASE}/${__ENV.INVITE ?? "demo"}/${__ENV.GUEST ?? "riyaFRND2"}`, { tags: { page: "guest" } });
  check(r, { "guest page 200": (x) => x.status === 200, "salutation in HTML": (x) => x.body.includes("ke liye") || x.body.includes("For ") });
  http.post(`${BASE}/api/g/${__ENV.INVITE ?? "demo"}/${__ENV.GUEST ?? "riyaFRND2"}/open`, JSON.stringify({ scene: "loader", tier: "B" }), { headers: { "content-type": "application/json" }, tags: { api: "open" } });
  sleep(1);
}
