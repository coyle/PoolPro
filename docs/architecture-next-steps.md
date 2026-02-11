# Architecture & Next Steps

## Current MVP architecture
- Next.js provides mobile-first UI and deterministic calculator UX.
- Go API exposes calculator and diagnose endpoints and safety-first responses.
- Prisma schema models user, customer, pool, water test, and treatment plan for historical tracking.

## Scaling plan
- Move from fallback diagnose to strict OpenAI JSON-schema output with retries and validation.
- Introduce queue-based plan generation for high-volume requests.
- Add observability: OpenTelemetry traces, SLOs, and alerting.

## IoT integration roadmap
1. Add `/api/v1/sensor-events` ingestion endpoint.
2. Store normalized sensor telemetry in time-series storage.
3. Trigger anomaly detection jobs (e.g., pH drift, FC decay).
4. Feed anomalies + trend summaries to LLM for contextual recommendations.
5. Add rules engine precedence over LLM for hard safety constraints.
