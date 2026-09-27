import { getAdminNotificationEmail } from "../_auth_utils.js";

// In-memory rate limiting for per-IP burst protection
const ipRequestHistory = new Map();
const BURST_WINDOW_MS = 60 * 1000; // 1 minute
const BURST_LIMIT = 3; // Max 3 submissions per minute
const EXTENDED_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const EXTENDED_LIMIT = 6; // Max 6 submissions per 10 minutes

function checkRateLimit(clientIp) {
  const now = Date.now();
  let timestamps = ipRequestHistory.get(clientIp) || [];
  // Purge records older than 10 minutes
  timestamps = timestamps.filter((t) => now - t < EXTENDED_WINDOW_MS);

  const burstCount = timestamps.filter((t) => now - t < BURST_WINDOW_MS).length;
  if (burstCount >= BURST_LIMIT || timestamps.length >= EXTENDED_LIMIT) {
    ipRequestHistory.set(clientIp, timestamps);
    return false;
  }

  timestamps.push(now);
  ipRequestHistory.set(clientIp, timestamps);
  return true;
}

/**
 * Cloudflare Pages Function: POST /api/admin/inquiries
 * Public-facing endpoint for New Account, Password Reset, and Maintenance requests.
 * Routes directly to the admin notification address without exposing it in the client bundle.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. IP Burst Protection / Rate Limiting
  const clientIp =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "127.0.0.1";

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: "Too many requests from your IP address. Please wait a moment before trying again.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, note, message, requestType } = body;

    const applicantNote = (note || message || "").toString().trim();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required to submit an inquiry." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanName = (name && typeof name === "string") ? name.trim() : email.split("@")[0];
    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = applicantNote;
    const type = requestType === "PASSWORD_RESET"
      ? "PASSWORD_RESET"
      : requestType === "MAINTENANCE"
      ? "MAINTENANCE"
      : "NEW_ACCOUNT";

    const typeLabel = type === "PASSWORD_RESET"
      ? "Password Reset & Account Recovery"
      : type === "MAINTENANCE"
      ? "Account Maintenance & Support"
      : "New Account Onboarding Request";

    // 2. Resolve admin recipient strictly server-side (never returned to client)
    const adminRecipient = await getAdminNotificationEmail(env);

    const userAgent = request.headers.get("User-Agent") || "Unknown Browser";
    const timestampIso = new Date().toISOString();
    const timestampFormatted = new Date().toUTCString();

    const subject = `[DeltaHarvest] ${typeLabel}: ${cleanName} (${cleanEmail})`;

    const textContent = `DeltaHarvest Institutional - Inquiry Notification

A user has submitted an inquiry to the platform administrator:

--------------------------------------------------
Inquiry Type:    ${typeLabel} (${type})
Submitter Name:  ${cleanName}
Submitter Email: ${cleanEmail}
Message / Notes: ${cleanNote || 'None provided'}
--------------------------------------------------
Timestamp:       ${timestampFormatted} (${timestampIso})
Origin IP:       ${clientIp}
User-Agent:      ${userAgent}

Reply directly to this email to contact the user at ${cleanEmail}.
Manage user accounts at: https://daily-stock-analysis-89j.pages.dev/admin/users
`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.3); }
    .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 6px 0; }
    .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
    .content { padding: 24px; }
    .card { background-color: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid #334155; }
    .row { margin-bottom: 10px; font-size: 13px; }
    .label { font-weight: 600; color: #94a3b8; display: inline-block; width: 130px; }
    .val { color: #f1f5f9; word-break: break-all; }
    .msg-box { background-color: #090d16; border-radius: 8px; padding: 12px; margin-top: 10px; border: 1px solid #1e293b; font-family: monospace; font-size: 12px; color: #cbd5e1; white-space: pre-wrap; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 20px; border-radius: 8px; }
    .footer { padding: 16px 24px; background-color: #090d16; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${type}</div>
      <h1 class="title">${typeLabel}</h1>
      <p class="subtitle">DeltaHarvest Institutional Security &amp; Access System</p>
    </div>
    <div class="content">
      <div class="card">
        <div class="row"><span class="label">Submitter Name:</span> <span class="val"><strong>${cleanName}</strong></span></div>
        <div class="row"><span class="label">Submitter Email:</span> <span class="val"><a href="mailto:${cleanEmail}" style="color:#38bdf8;">${cleanEmail}</a></span></div>
        <div class="row"><span class="label">Inquiry Type:</span> <span class="val">${typeLabel}</span></div>
        <div class="row"><span class="label">Timestamp:</span> <span class="val">${timestampFormatted}</span></div>
        <div class="row"><span class="label">Origin IP:</span> <span class="val"><code>${clientIp}</code></span></div>
        <div style="margin-top: 12px;">
          <div class="label" style="width: auto; margin-bottom: 4px;">Submitted Message / Context:</div>
          <div class="msg-box">${cleanNote ? cleanNote.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<em>No message provided</em>"}</div>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="mailto:${cleanEmail}?subject=Re:%20DeltaHarvest%20${encodeURIComponent(typeLabel)}" class="btn">
          Reply to Submitter (${cleanEmail})
        </a>
      </div>
    </div>
    <div class="footer">
      Automated notification sent to platform administrator &bull; DeltaHarvest Institutional
    </div>
  </div>
</body>
</html>`;

    let emailSent = false;

    // 3. Primary Dispatch: Resend REST API
    if (env.RESEND_API_KEY) {
      try {
        const fromAddress = env.EMAIL_FROM || "DeltaHarvest Inquiries <onboarding@resend.dev>";
        const resendResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [adminRecipient],
            reply_to: cleanEmail,
            subject,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (resendResp.ok) {
          emailSent = true;
          console.info(`[inquiries] Dispatched inquiry ${type} via Resend API to administrator.`);
        } else {
          const errData = await resendResp.text();
          console.warn(`[inquiries] Resend API returned ${resendResp.status}:`, errData);
        }
      } catch (rErr) {
        console.warn("[inquiries] Resend dispatch failed:", rErr);
      }
    }

    // 4. Secondary Fallback: MailChannels (Zero-config for Cloudflare Pages/Workers)
    if (!emailSent) {
      try {
        const mcResp = await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: adminRecipient, name: "Platform Administrator" }],
              },
            ],
            from: {
              email: "no-reply@daily-stock-analysis-89j.pages.dev",
              name: "DeltaHarvest Inquiries",
            },
            reply_to: {
              email: cleanEmail,
              name: cleanName,
            },
            subject,
            content: [
              { type: "text/html", value: htmlContent },
              { type: "text/plain", value: textContent },
            ],
          }),
        });

        if (mcResp.ok || mcResp.status === 202) {
          emailSent = true;
          console.info(`[inquiries] Dispatched inquiry ${type} via MailChannels.`);
        }
      } catch (mcErr) {
        console.warn("[inquiries] MailChannels dispatch failed:", mcErr);
      }
    }

    // 5. Always return a generic success message that discloses no email address
    return new Response(
      JSON.stringify({
        success: true,
        message: "Your inquiry has been submitted and forwarded to the platform administrator.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[inquiries] Internal inquiry dispatch error:", err);
    return new Response(
      JSON.stringify({
        error: "Unable to process your request at this time. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
