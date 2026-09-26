/**
 * Cloudflare Pages Function: GET /version
 * Exposes lightweight build identification and deployment metadata.
 */
export async function onRequestGet(context) {
  const commitSha = context.env.CF_PAGES_COMMIT_SHA || "unknown";
  const branch = context.env.CF_PAGES_BRANCH || "main";
  const timestamp = new Date().toISOString();

  return new Response(
    JSON.stringify({
      app: "DeltaHarvest Institutional",
      version: "3.4",
      buildId: `dh-${commitSha.substring(0, 7)}-live`,
      commit: commitSha.substring(0, 7),
      branch,
      timestamp,
      environment: context.env.ENVIRONMENT || "production",
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
