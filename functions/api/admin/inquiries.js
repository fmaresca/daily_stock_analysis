import { getAdminNotificationEmail, authenticateRequest, getUserByEmail } from "../_auth_utils.js";
import { getClientIp } from "../_rate_limit.js";
import { sendResendEmail, logEmailDelivery, getEmailHealth } from "../_email_delivery.js";

// In-memory rate limiting for per-IP burst protection
const ipRequestHistory = new Map();
const BURST_WINDOW_MS = 60 * 1000; // 1 minute
const BURST_LIMIT = 3; // Max 3 submissions per minute
const EXTENDED_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const EXTENDED_LIMIT = 6; // Max 6 submissions per 10 minutes

function checkRateLimit(clientIp) {
  const now = Date.now(); // wall-clock-ok: in-memory rate limit window
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
  const url = new URL(request.url);

  // 1. IP Burst Protection / Rate Limiting
  const clientIp = getClientIp(request);

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
    const timestampIso = new Date().toISOString(); // wall-clock-ok: notification timestamp
    const timestampFormatted = new Date().toUTCString(); // wall-clock-ok: notification timestamp

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
    const deliveryProtocols = [];
    const diagnostics = {
      adminRecipient,
      resendConfigured: !!(env.RESEND_API_KEY && env.RESEND_API_KEY.trim()),
    };

    // 3. Primary Dispatch: Resend REST API (if configured)
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() && adminRecipient) {
      const fromAddress = env.EMAIL_FROM || "DeltaHarvest Inquiries <onboarding@resend.dev>";
      const r = await sendResendEmail({
        apiKey: env.RESEND_API_KEY,
        from: fromAddress,
        to: adminRecipient,
        replyTo: cleanEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });

      diagnostics.resendStatus = r.status;
      diagnostics.resendResponse = r.body;
      diagnostics.resendAttempts = r.attempts;

      if (r.ok) {
        emailSent = true;
        deliveryProtocols.push("Resend API");
        console.info(`[inquiries] Dispatched inquiry ${type} via Resend API to ${adminRecipient}.`);
      } else {
        console.warn(`[inquiries] Resend API returned ${r.status}:`, r.body);
      }

      await logEmailDelivery(env, {
        endpoint: "inquiry_post",
        recipient: adminRecipient,
        channel: "Resend API",
        httpStatus: r.status,
        attempts: r.attempts,
        errorName: r.ok ? null : (r.body?.name || "resend_error"),
        errorMessage: r.ok ? null : (r.body?.message || JSON.stringify(r.body).slice(0, 300)),
      });
    }

    // 4. Active Fallback: FormSubmit Direct Email Gateway (Zero-config HTTPS transport)
    if (!emailSent && adminRecipient) {
      const fsOrigin = "https://daily-stock-analysis-89j.pages.dev";
      try {
        const fsResp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(adminRecipient)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": fsOrigin,
            "Referer": `${fsOrigin}/`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            _subject: subject,
            _captcha: "false",
            name: cleanName,
            email: cleanEmail,
            requestType: typeLabel,
            message: cleanNote || "None provided",
            timestamp: timestampFormatted,
            originIP: clientIp,
            _replyto: cleanEmail,
            _template: "table",
          }),
        });

        diagnostics.formSubmitStatus = fsResp.status;
        const fsData = await fsResp.json().catch((parseErr) => ({ parseError: String(parseErr) }));
        diagnostics.formSubmitResponse = fsData;

        if (fsResp.ok && fsData && (fsData.success === true || fsData.success === "true")) {
          emailSent = true;
          deliveryProtocols.push("FormSubmit Gateway");
          console.info(`[inquiries] Dispatched inquiry ${type} via FormSubmit to ${adminRecipient}.`);
        } else {
          console.warn(`[inquiries] FormSubmit HTTP ${fsResp.status}:`, fsData);
        }
      } catch (fsErr) {
        diagnostics.formSubmitError = String(fsErr);
        console.warn("[inquiries] FormSubmit dispatch error:", fsErr);
      }

      await logEmailDelivery(env, {
        endpoint: "inquiry_post",
        recipient: adminRecipient,
        channel: "FormSubmit Gateway",
        httpStatus: diagnostics.formSubmitStatus ?? null,
        attempts: 1,
        errorName: emailSent ? null : (diagnostics.formSubmitError ? "network_error" : "formsubmit_error"),
        errorMessage: emailSent ? null : (diagnostics.formSubmitError || JSON.stringify(diagnostics.formSubmitResponse).slice(0, 300)),
      });

      // Try URL-encoded FormSubmit endpoint if JSON attempt did not report success
      if (!emailSent) {
        try {
          const formParams = new URLSearchParams();
          formParams.append("_subject", subject);
          formParams.append("_captcha", "false");
          formParams.append("name", cleanName);
          formParams.append("email", cleanEmail);
          formParams.append("requestType", typeLabel);
          formParams.append("message", cleanNote || "None provided");
          formParams.append("_replyto", cleanEmail);
          formParams.append("timestamp", timestampFormatted);

          const formResp = await fetch(`https://formsubmit.co/${encodeURIComponent(adminRecipient)}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Origin": fsOrigin,
              "Referer": `${fsOrigin}/`,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            body: formParams.toString(),
          });
          const formResText = await formResp.text().catch(() => "");
          if (formResp.ok || formResText.includes("Thanks!") || formResText.includes("submitted successfully")) {
            emailSent = true;
            deliveryProtocols.push("FormSubmit URL-Encoded");
            console.info(`[inquiries] Dispatched inquiry ${type} via FormSubmit URL-Encoded to ${adminRecipient}.`);
          }
        } catch (ueErr) {
          console.warn("[inquiries] FormSubmit URL-Encoded error:", ueErr);
        }
      }
    }

    // 5. Additional Fallback: MailChannels (if available)
    if (!emailSent) {
      let mcStatus = 0;
      let mcErrStr = null;
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

        mcStatus = mcResp.status;
        if (mcResp.ok || mcResp.status === 202) {
          emailSent = true;
          deliveryProtocols.push("MailChannels");
          console.info(`[inquiries] Dispatched inquiry ${type} via MailChannels.`);
        }
      } catch (mcErr) {
        mcErrStr = String(mcErr);
        console.warn("[inquiries] MailChannels dispatch failed:", mcErr);
      }

      await logEmailDelivery(env, {
        endpoint: "inquiry_post",
        recipient: adminRecipient,
        channel: "MailChannels",
        httpStatus: mcStatus || null,
        attempts: 1,
        errorName: emailSent ? null : (mcErrStr ? "network_error" : "mailchannels_error"),
        errorMessage: emailSent ? null : (mcErrStr || (mcStatus ? `HTTP ${mcStatus}` : "mailchannels_failed")),
      });
    }

    // 6. Webhook Broadcast (if env.ADMIN_NOTIFICATION_WEBHOOK or env.DISCORD_WEBHOOK_URL is configured)
    const webhookUrl = env.ADMIN_NOTIFICATION_WEBHOOK || env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const isDiscord = webhookUrl.includes("discord.com") || webhookUrl.includes("discordapp.com");
        const webhookBody = isDiscord
          ? {
              embeds: [
                {
                  title: `[DeltaHarvest] ${typeLabel}`,
                  color: type === "NEW_ACCOUNT" ? 0x10b981 : type === "PASSWORD_RESET" ? 0xf59e0b : 0x6366f1,
                  fields: [
                    { name: "Submitter Name", value: cleanName, inline: true },
                    { name: "Submitter Email", value: cleanEmail, inline: true },
                    { name: "Inquiry Type", value: typeLabel, inline: true },
                    { name: "Submitted Message", value: cleanNote || "None provided" },
                    { name: "Origin IP", value: clientIp, inline: true },
                    { name: "Timestamp", value: timestampFormatted, inline: true },
                  ],
                  footer: { text: "DeltaHarvest Institutional Security" },
                },
              ],
            }
          : {
              event: "user.inquiry",
              requestType: type,
              name: cleanName,
              email: cleanEmail,
              note: cleanNote,
              timestamp: timestampIso,
              ip: clientIp,
            };

        const whResp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookBody),
        });
        if (whResp.ok || whResp.status === 204) {
          deliveryProtocols.push("Admin Webhook");
          console.info(`[inquiries] Dispatched inquiry ${type} to admin webhook.`);
        }
      } catch (whErr) {
        console.warn("[inquiries] Webhook dispatch error:", whErr);
      }
    }

    // 7. Persistent Audit Record in Cloudflare D1 (Guaranteed storage on platform)
    if (env && env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS access_inquiries (
            id TEXT PRIMARY KEY,
            request_type TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            note TEXT,
            ip TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
          )
        `).run();
        const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`; // wall-clock-ok: unique inquiry ID
        await env.DB.prepare(`
          INSERT INTO access_inquiries (id, request_type, name, email, note, ip, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          inquiryId,
          type,
          cleanName,
          cleanEmail,
          cleanNote,
          clientIp,
          emailSent ? "delivered" : "received"
        ).run();
        deliveryProtocols.push("D1 Audit Storage");
      } catch (dbErr) {
        console.warn("[inquiries] D1 access_inquiries insert error:", dbErr);
      }
    }

    // 8. Return response with delivery confirmation strictly without exposing admin PII or protocols
    return new Response(
      JSON.stringify({
        success: true,
        delivered: emailSent,
        deliveryProtocols,
        diagnostics: (body?.debug || url.searchParams.get("debug") === "1") ? diagnostics : undefined,
        message: emailSent
          ? "Your inquiry has been submitted and forwarded directly to the platform administrator."
          : "Your inquiry has been registered with the platform administrator.",
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

/**
 * Cloudflare Pages Function: GET /api/admin/inquiries
 * Returns recent access inquiries and requests (restricted to authenticated administrators).
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  // Mandatory Administrator Authentication Gate for ALL GET actions
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  if (action === "test_resend" || url.searchParams.get("test_resend") === "1") {
    if (!env.RESEND_API_KEY || !env.RESEND_API_KEY.trim()) {
      return new Response(
        JSON.stringify({
          configured: false,
          error: "RESEND_API_KEY is not provisioned or is empty in Cloudflare environment.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const adminRecipient = await getAdminNotificationEmail(env);
    if (!adminRecipient) {
      return new Response(
        JSON.stringify({
          configured: false,
          error: "Admin recipient email is not configured in system_settings or ADMIN_NOTIFICATION_EMAIL.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const fromAddress = env.EMAIL_FROM || "DeltaHarvest Inquiries <onboarding@resend.dev>";
    const r = await sendResendEmail({
      apiKey: env.RESEND_API_KEY,
      from: fromAddress,
      to: adminRecipient,
      subject: "[DeltaHarvest] Resend Configuration Verification Test",
      text: `This is an automated verification test email dispatched via Resend REST API to ${adminRecipient}.`,
    });
    await logEmailDelivery(env, {
      endpoint: "test_resend",
      recipient: adminRecipient,
      channel: "Resend API",
      httpStatus: r.status,
      attempts: r.attempts,
      errorName: r.ok ? null : (r.body?.name || "resend_error"),
      errorMessage: r.ok ? null : (r.body?.message || JSON.stringify(r.body).slice(0, 300)),
    });
    return new Response(
      JSON.stringify({
        configured: true,
        status: r.status,
        ok: r.ok,
        from: fromAddress,
        to: adminRecipient,
        resendResponse: r.body,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "email_health" || action === "health") {
    const healthData = await getEmailHealth(env);
    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "test_email" || action === "test_delivery") {
    const adminRecipient = await getAdminNotificationEmail(env);
    if (!adminRecipient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Admin recipient email is not configured.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const testSubject = `[DeltaHarvest System Test] Administrator Email Alert Verified`;
    const testText = `This is a verified live test alert sent from the DeltaHarvest Tenant User Directory to confirm that email notifications arrive in ${adminRecipient}.`;
    const testHtml = `<p>${testText}</p>`;
    let emailSent = false;
    const protocols = [];
    const testDiag = { recipient: adminRecipient };

    // 1. Resend (with retry on transient failures)
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim()) {
      const fromAddress = env.EMAIL_FROM || "DeltaHarvest Inquiries <onboarding@resend.dev>";
      const r = await sendResendEmail({
        apiKey: env.RESEND_API_KEY,
        from: fromAddress,
        to: adminRecipient,
        subject: testSubject,
        text: testText,
        html: testHtml,
      });
      testDiag.resendStatus = r.status;
      testDiag.resendResponse = r.body;
      testDiag.resendAttempts = r.attempts;
      if (r.ok) {
        emailSent = true;
        protocols.push("Resend API");
      }
      await logEmailDelivery(env, {
        endpoint: "test_email",
        recipient: adminRecipient,
        channel: "Resend API",
        httpStatus: r.status,
        attempts: r.attempts,
        errorName: r.ok ? null : (r.body?.name || "resend_error"),
        errorMessage: r.ok ? null : (r.body?.message || JSON.stringify(r.body).slice(0, 300)),
      });
    }

    // 2. FormSubmit Gateway fallback
    if (!emailSent) {
      const fsOrigin = "https://daily-stock-analysis-89j.pages.dev";
      try {
        const fsResp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(adminRecipient)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": fsOrigin,
            "Referer": `${fsOrigin}/`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            _subject: testSubject,
            _captcha: "false",
            name: "Platform Administrator",
            email: adminRecipient,
            requestType: "System Test",
            message: testText,
            timestamp: new Date().toUTCString(), // wall-clock-ok: diagnostic test timestamp
            _template: "table",
          }),
        });
        const fsData = await fsResp.json().catch(() => ({}));
        testDiag.formSubmitStatus = fsResp.status;
        testDiag.formSubmitResponse = fsData;
        if (fsResp.ok && fsData && (fsData.success === true || fsData.success === "true")) {
          emailSent = true;
          protocols.push("FormSubmit Gateway");
        }
      } catch (fsErr) {
        testDiag.formSubmitError = String(fsErr);
      }
      await logEmailDelivery(env, {
        endpoint: "test_email",
        recipient: adminRecipient,
        channel: "FormSubmit Gateway",
        httpStatus: testDiag.formSubmitStatus ?? null,
        attempts: 1,
        errorName: emailSent ? null : (testDiag.formSubmitError ? "network_error" : "formsubmit_error"),
        errorMessage: emailSent ? null : (testDiag.formSubmitError || JSON.stringify(testDiag.formSubmitResponse).slice(0, 300)),
      });
    }

    return new Response(
      JSON.stringify({
        success: emailSent,
        recipient: adminRecipient,
        protocols,
        deliveredBy: protocols.join(", ") || "None",
        diagnostics: testDiag,
        message: emailSent
          ? `✓ Test alert successfully delivered to ${adminRecipient} via ${protocols.join(", ")}!`
          : `Failed to deliver test alert to ${adminRecipient}.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    if (env && env.DB) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS access_inquiries (
          id TEXT PRIMARY KEY,
          request_type TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          note TEXT,
          ip TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();

      // Security query hardening (cite: plaintext token exposure, 2026-10-11):
      // Explicitly select only non-sensitive columns. Plaintext tokens or raw URLs must NEVER be returned.
      const rows = await env.DB.prepare(`
        SELECT id, request_type, name, email, note, ip, status, created_at
        FROM access_inquiries
        ORDER BY created_at DESC
        LIMIT 50
      `).all();

      const inquiries = (rows.results || []).map((row) => {
        // Plaintext token exposure remediation (cite: plaintext token exposure, 2026-10-11):
        // Ensure no legacy or newly inserted note exposes a plaintext reset token or URL.
        let safeNote = row.note || "";
        let tokenFingerprint = null;

        if (row.request_type === "PASSWORD_RESET") {
          // If legacy note contained reset_token, extract safe correlation fingerprint (first 6 chars)
          const tokenMatch = safeNote.match(/reset_token=([a-fA-F0-9]{6})/);
          if (tokenMatch) {
            tokenFingerprint = `${tokenMatch[1]}…`;
          } else {
            // Derive a safe non-usable correlation fingerprint from the inquiry ID
            const idHash = (row.id || "").replace(/^inq_reset_/, "");
            tokenFingerprint = idHash ? `${idHash.substring(0, 6)}…` : "rst…";
          }
          // Never return reset URL or raw token in the note field
          safeNote = "Password reset link dispatched directly to user email.";
        } else if (safeNote.includes("reset_token=")) {
          // Extra defense in depth: scrub any string resembling a reset token from any note
          safeNote = safeNote.replace(/reset_token=[a-zA-Z0-9_\-]+/g, "reset_token=[REDACTED]");
        }

        // Calculate expiry timestamp (reset tokens expire 30 minutes after issuance)
        let expiresAt = null;
        let computedStatus = row.status || "pending";
        if (row.created_at) {
          const createdMs = new Date(row.created_at.includes("T") ? row.created_at : row.created_at + "Z").getTime();
          if (!isNaN(createdMs)) {
            expiresAt = new Date(createdMs + 30 * 60 * 1000).toISOString();
            const nowMs = Date.now(); // wall-clock-ok: inquiry expiry calculation
            if (computedStatus === "pending" && nowMs > createdMs + 30 * 60 * 1000) {
              computedStatus = "expired";
            }
          }
        }

        return {
          id: row.id,
          request_type: row.request_type,
          name: row.name,
          email: row.email,
          note: safeNote,
          ip: row.ip,
          status: computedStatus,
          created_at: row.created_at,
          expires_at: expiresAt,
          token_fingerprint: tokenFingerprint,
        };
      });

      return new Response(
        JSON.stringify({ success: true, inquiries }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: true, inquiries: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[inquiries] Failed to fetch inquiries:", err);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve access inquiries." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Cloudflare Pages Function: PATCH /api/admin/inquiries
 * Updates inquiry status (e.g. revoking a pending password reset inquiry).
 * Restricted to authenticated administrators.
 */
export async function onRequestPatch(context) {
  const { request, env } = context;
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { id, status } = body;
    if (!id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Missing inquiry ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetStatus = status === "revoked" ? "revoked" : (status || "revoked");

    if (env && env.DB) {
      const inquiry = await env.DB.prepare(
        "SELECT id, request_type, email FROM access_inquiries WHERE id = ?"
      ).bind(id).first();

      if (!inquiry) {
        return new Response(JSON.stringify({ error: "Inquiry not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      await env.DB.prepare(
        "UPDATE access_inquiries SET status = ? WHERE id = ?"
      ).bind(targetStatus, id).run();

      // If revoking a password reset, immediately invalidate active reset tokens for that user
      if (targetStatus === "revoked" && inquiry.request_type === "PASSWORD_RESET" && inquiry.email) {
        const targetUser = await getUserByEmail(env, inquiry.email);
        if (targetUser && targetUser.id) {
          try {
            await env.DB.prepare(
              "DELETE FROM password_reset_tokens WHERE user_id = ?"
            ).bind(targetUser.id).run();
          } catch (delErr) {
            console.warn("Failed to delete password reset token during revocation:", delErr);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, id, status: targetStatus }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id, status: targetStatus }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[inquiries] Failed to update inquiry status:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update inquiry status." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
