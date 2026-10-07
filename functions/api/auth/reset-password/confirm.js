import {
  hashTokenSha256,
  consumePasswordResetToken,
  getUserById,
  generateRandomSalt,
  hashPassword,
  updateUserPassword,
} from "../../_auth_utils.js";
import {
  getClientIp,
  checkRateLimit,
  buildRateLimitResponse,
} from "../../_rate_limit.js";

/**
 * Cloudflare Pages Function: POST /api/auth/reset-password/confirm
 * Step B of two-step secure password reset flow:
 * Consumes single-use token hash, verifies expiry, updates PBKDF2 password hash in D1,
 * and requires the user to log in afresh with new credentials (no auto-login).
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { token, newPassword, confirmPassword } = body;

    const clientIp = getClientIp(request);
    // Rate limit token confirmation attempts to prevent brute force on reset tokens
    const ipLimit = await checkRateLimit(env, `reset:confirm:ip:${clientIp}`, 15, 900);
    if (!ipLimit.allowed) {
      return buildRateLimitResponse(ipLimit.retryAfter, "Too many password reset confirmation attempts. Please try again later.");
    }

    if (!token || typeof token !== "string" || !token.trim()) {
      return new Response(
        JSON.stringify({ error: "Password reset token is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 8 characters long." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      return new Response(
        JSON.stringify({ error: "Password confirmation does not match new password." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash incoming plaintext token with SHA-256 to lookup stored record
    const cleanToken = token.trim();
    const tokenHash = await hashTokenSha256(cleanToken);

    // Atomically retrieve and delete token row to ensure single-use
    const userId = await consumePasswordResetToken(env, tokenHash);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired password reset token." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await getUserById(env, userId);
    if (!user || user.is_active === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired password reset token." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash new password using PBKDF2 (100,000 iterations) with fresh cryptographic salt
    const saltHex = generateRandomSalt(16);
    const hashHex = await hashPassword(newPassword, saltHex);

    // Update password in D1 (and memory fallback)
    await updateUserPassword(env, user.id, hashHex, saltHex);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated, please sign in.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Password reset confirmation error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update password. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
