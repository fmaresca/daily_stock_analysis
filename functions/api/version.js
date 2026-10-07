/**
 * Cloudflare Pages Function: GET /api/version
 * Exposes lightweight build identification and metadata (strictly without operational PII).
 */
export async function onRequestGet(context) {
  const commitSha = context.env.CF_PAGES_COMMIT_SHA || "unknown";

  return new Response(
    JSON.stringify({
      app: "DeltaHarvest Institutional",
      version: "3.4",
      buildId: `dh-${commitSha.substring(0, 7)}-live`,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
