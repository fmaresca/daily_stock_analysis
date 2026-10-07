import {
  getUserByEmail,
  generateSecureRandomToken,
  hashTokenSha256,
  storePasswordResetToken,
  getAdminNotificationEmail,
} from "../_auth_utils.js";
import {
  getClientIp,
  checkRateLimit,
  buildRateLimitResponse,
} from "../_rate_limit.js";

/**
 * Cloudflare Pages Function: POST /api/auth/reset-password
 * Step A of two-step secure password reset flow:
 * Generates a cryptographically random single-use token, stores its SHA-256 hash
 * in D1 with a 30-minute expiry, and emails the reset link to the account's registered email.
 * Always returns the IDENTICAL generic response to prevent account enumeration.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Rate Limiting (Prompt 1 & Prompt 5):
    // Max 20 reset requests per IP per hour (3600s)
    const ipLimit = await checkRateLimit(env, `reset:ip:${clientIp}`, 20, 3600);
    if (!ipLimit.allowed) {
      return buildRateLimitResponse(ipLimit.retryAfter, "Too many password reset attempts from this IP. Please try again later.");
    }

    // Max 5 reset requests per email per hour (3600s)
    const emailLimit = await checkRateLimit(env, `reset:email:${cleanEmail}`, 5, 3600);
    if (!emailLimit.allowed) {
      return buildRateLimitResponse(emailLimit.retryAfter, "Too many password reset requests for this email. Please try again later.");
    }

    const genericSuccessResponse = () =>
      new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists for that email, a reset link has been sent.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    // Require D1 database for reliable distributed token persistence
    if (!env || !env.DB) {
      if (env?.ENVIRONMENT !== "development") {
        return new Response(
          JSON.stringify({ error: "Password reset is temporarily unavailable. Please contact your administrator." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Look up user in D1 (or memory in local development)
    const user = await getUserByEmail(env, cleanEmail);

    // If account does not exist or is suspended/inactive, return the generic response
    // without leaking account status or presence.
    if (!user || user.is_active === 0) {
      return genericSuccessResponse();
    }

    // Account exists & active: verify Resend is configured before issuing token
    if (!env.RESEND_API_KEY || !env.RESEND_API_KEY.trim()) {
      const adminEmail = await getAdminNotificationEmail(env);
      console.error("Password reset unavailable: RESEND_API_KEY is not configured. Admin recipient:", adminEmail);
      return new Response(
        JSON.stringify({ error: "Password reset is temporarily unavailable. Please contact your administrator." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate cryptographically random 32-byte single-use token
    const plaintextToken = generateSecureRandomToken(32);
    const tokenHash = await hashTokenSha256(plaintextToken);

    // Store ONLY the SHA-256 hash in D1 with a 30-minute expiration
    await storePasswordResetToken(env, tokenHash, user.id, 30);

    // Construct reset link containing plaintext token
    const url = new URL(request.url);
    const resetUrl = `${url.origin}/login?reset_token=${plaintextToken}`;

    // Dispatch reset link to registered email via Resend
    let emailDispatched = false;
    const fromAddress = env.EMAIL_FROM || "DeltaHarvest Security <onboarding@resend.dev>";
    const emailSubject = "[DeltaHarvest] Account Password Reset Instructions";
    const textBody = `Hello,\n\nA password reset request was initiated for your DeltaHarvest account (${cleanEmail}).\n\nTo reset your password, visit the following URL:\n${resetUrl}\n\nAlternatively, you may enter this reset token directly into the login portal:\n${plaintextToken}\n\nThis token is valid for 30 minutes and can only be used once.\nIf you did not request this reset, no action is needed.\n\nDeltaHarvest Institutional Security Team`;
    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px;">
    <h2 style="color: #10b981; margin-top: 0;">DeltaHarvest Institutional</h2>
    <p style="color: #cbd5e1; font-size: 14px;">A password reset request was initiated for account: <strong>${cleanEmail}</strong></p>
    <p style="color: #94a3b8; font-size: 13px;">To set a new password, click the button below within the next 30 minutes:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px;">Or enter this single-use reset token in the terminal:</p>
    <div style="background-color: #020617; border: 1px solid #334155; padding: 10px; border-radius: 6px; font-family: monospace; color: #38bdf8; word-break: break-all; font-size: 13px;">${plaintextToken}</div>
    <p style="color: #64748b; font-size: 11px; margin-top: 20px;">If you did not request this, please disregard this message. Never share this token with anyone.</p>
  </div>
</body>
</html>`;

    try {
      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [cleanEmail],
          subject: emailSubject,
          text: textBody,
          html: htmlBody,
        }),
      });
      if (resendResp.ok) {
        emailDispatched = true;
      } else {
        console.error("Resend password reset API error:", resendResp.status, await resendResp.text().catch(() => ""));
      }
    } catch (emailErr) {
      console.error("Resend password reset email dispatch failed:", emailErr);
    }

    if (!emailDispatched) {
      const adminEmail = await getAdminNotificationEmail(env);
      console.error("Password reset email delivery failed via Resend. Admin recipient:", adminEmail);
      return new Response(
        JSON.stringify({ error: "Password reset is temporarily unavailable. Please contact your administrator." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Always return the identical generic confirmation
    return genericSuccessResponse();
  } catch (err) {
    console.error("Password reset request error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred while processing your request." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
