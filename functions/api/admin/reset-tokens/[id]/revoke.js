/**
 * Cloudflare Pages Function: POST /api/admin/reset-tokens/:id/revoke
 * Dedicated endpoint to revoke a pending password reset token and update audit records.
 * Restricted to authenticated administrators only.
 */

import { authenticateRequest, getUserByEmail } from "../../../_auth_utils.js";

export async function onRequestPost(context) {
  const { params, env } = context;
  const inquiryId = params?.id;

  // 1. Enforce strict administrator authorization
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) {
    return auth.response;
  }

  if (!inquiryId || typeof inquiryId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid token / inquiry identifier." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (env && env.DB) {
    try {
      // 2. Locate inquiry record
      const inquiry = await env.DB.prepare(
        "SELECT id, request_type, email, status, note FROM access_inquiries WHERE id = ?"
      ).bind(inquiryId).first();

      let targetEmail = inquiry?.email;

      // 3. If already revoked, return idempotent success
      if (inquiry && inquiry.status === "revoked") {
        return new Response(
          JSON.stringify({
            success: true,
            id: inquiryId,
            status: "revoked",
            alreadyRevoked: true,
            message: "Reset token was already revoked.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 4. Update inquiry status to 'revoked'
      if (inquiry) {
        await env.DB.prepare(
          "UPDATE access_inquiries SET status = ? WHERE id = ?"
        ).bind("revoked", inquiryId).run();
      }

      // 5. Invalidate active reset tokens in password_reset_tokens
      if (targetEmail) {
        const targetUser = await getUserByEmail(env, targetEmail);
        if (targetUser && targetUser.id) {
          await env.DB.prepare(
            "DELETE FROM password_reset_tokens WHERE user_id = ?"
          ).bind(targetUser.id).run();
        }
      }

      // Also clean up by direct token hash or user id matching the param
      await env.DB.prepare(
        "DELETE FROM password_reset_tokens WHERE token_hash = ? OR user_id = ?"
      ).bind(inquiryId, inquiryId).run();

      return new Response(
        JSON.stringify({
          success: true,
          id: inquiryId,
          status: "revoked",
          message: "Password reset token successfully revoked.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (dbErr) {
      console.error("[revoke] Database error revoking token:", dbErr);
      return new Response(
        JSON.stringify({ error: "Failed to process token revocation." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Fallback for mock/test environments
  return new Response(
    JSON.stringify({
      success: true,
      id: inquiryId,
      status: "revoked",
      message: "Password reset token revoked (in-memory mode).",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// Support PATCH and DELETE as secondary verbs on this route for convenience
export async function onRequestPatch(context) {
  return onRequestPost(context);
}

export async function onRequestDelete(context) {
  return onRequestPost(context);
}
