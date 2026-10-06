import {
  getUserByEmail,
  generateRandomSalt,
  hashPassword,
  resetUserPasswordByEmail,
  createSessionToken,
  buildSessionCookie,
  DEFAULT_SECRET,
} from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/auth/reset-password
 * Public self-service password reset for registered tenants.
 * Dispatches automated security audit notification to platform administrator (fjmaresca@gmail.com).
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { email, newPassword, confirmPassword } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return new Response(
        JSON.stringify({ error: "Registered email address is required." }),
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

    const cleanEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(env, cleanEmail);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: `No account registered with email ${cleanEmail}. Please verify the address or request account onboarding.`,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (user.is_active === 0) {
      return new Response(
        JSON.stringify({
          error: "Your account is currently suspended. Please contact the administrator at fjmaresca@gmail.com.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash new password using PBKDF2 (100,000 iterations)
    const saltHex = generateRandomSalt();
    const hashHex = await hashPassword(newPassword, saltHex);

    await resetUserPasswordByEmail(env, cleanEmail, hashHex, saltHex, false);

    // Security audit notification to administrator
    const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || "fjmaresca@gmail.com";
    const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Edge Client";
    const userAgent = request.headers.get("user-agent") || "Web Browser";
    const timestamp = new Date().toISOString();

    const notifySubject = `[DeltaHarvest Security] Password Reset Alert: ${user.display_name || cleanEmail} (${cleanEmail})`;
    const notifyBody = `Security Event: Password Reset Succeeded\nAccount: ${cleanEmail}\nUser Name: ${user.display_name || "N/A"}\nRole: ${user.role}\nTimestamp: ${timestamp}\nClient IP: ${clientIp}\nUser-Agent: ${userAgent}\n\nThis is an automated security audit dispatch from DeltaHarvest Institutional Edge.`;

    // 1. If Resend configured
    if (env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "DeltaHarvest Security <onboarding@resend.dev>",
            to: adminEmail,
            subject: notifySubject,
            text: notifyBody,
          }),
        });
      } catch (e) {
        console.warn("Resend notification error:", e);
      }
    }

    // 2. Dispatch via FormSubmit gateway for guaranteed delivery
    try {
      await fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          _subject: notifySubject,
          event: "PASSWORD_RESET",
          email: cleanEmail,
          displayName: user.display_name || cleanEmail,
          role: user.role,
          timestamp,
          ip: clientIp,
          _template: "table",
        }),
      });
    } catch (e) {
      console.warn("FormSubmit notification error:", e);
    }

    // Issue updated session token so user can optionally immediately access workspace
    const secret = env.SESSION_SECRET || DEFAULT_SECRET;
    const token = await createSessionToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.display_name || user.email.split("@")[0],
      },
      secret
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password for ${cleanEmail} has been successfully updated. You may now sign in.`,
        email: cleanEmail,
        user: {
          email: user.email,
          role: user.role,
          display_name: user.display_name || user.email.split("@")[0],
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": buildSessionCookie(token),
        },
      }
    );
  } catch (err) {
    console.error("Password reset error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reset password. Please try again or contact administrator." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
