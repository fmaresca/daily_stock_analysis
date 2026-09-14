import { PRIMARY_ADMIN_EMAIL } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/auth/request-access
 * Dispatches automated email notification to Super-Admin (fjmaresca@gmail.com)
 * when a prospective user requests account login credentials.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, note } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required to request login credentials." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanName = (name && typeof name === "string") ? name.trim() : email.split("@")[0];
    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = (note && typeof note === "string") ? note.trim() : "";

    const adminEmail = env.ADMIN_EMAIL || PRIMARY_ADMIN_EMAIL;
    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "Unknown IP";
    const userAgent = request.headers.get("User-Agent") || "Unknown Browser";
    const timestampIso = new Date().toISOString();
    const timestampFormatted = new Date().toUTCString();

    const subject = `[DeltaHarvest Access Request] New Client Login Requested: ${cleanName} (${cleanEmail})`;

    const textContent = `DeltaHarvest Platform - New User Credential Request

An individual has submitted a request for login credentials to the DeltaHarvest Stock & Options Analytics Platform.

Applicant Details:
- Name: ${cleanName}
- Email: ${cleanEmail}
- Message / Trading Focus: ${cleanNote || 'None provided'}
- Request Time: ${timestampFormatted} (${timestampIso})
- Network Origin: IP ${clientIp}
- User Agent: ${userAgent}

Administrator Actions:
1. Provision this user in the Admin Console:
   https://daily-stock-analysis-89j.pages.dev/admin/users
2. Reply directly to applicant:
   ${cleanEmail}

This is an automated security and access notification.`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 24px; border-bottom: 1px solid #10b981/30; }
    .logo-badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; rounded-radius: 9999px; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 6px 0; }
    .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
    .content { padding: 24px; }
    .card { background-color: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid #334155; }
    .field-row { display: flex; margin-bottom: 12px; font-size: 13px; }
    .field-row:last-child { margin-bottom: 0; }
    .field-label { width: 130px; font-weight: 600; color: #94a3b8; shrink: 0; }
    .field-val { color: #f1f5f9; font-weight: 500; word-break: break-all; }
    .actions { text-align: center; margin-top: 24px; }
    .btn-primary { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .btn-secondary { display: inline-block; background-color: #334155; color: #e2e8f0 !important; text-decoration: none; font-size: 12px; font-weight: 500; padding: 10px 18px; border-radius: 8px; margin-left: 10px; }
    .footer { padding: 18px 24px; background-color: #090d16; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">Security & Access Management</div>
      <h1 class="title">New Client Login Request</h1>
      <p class="subtitle">An applicant has requested tenant credentials for DeltaHarvest</p>
    </div>
    <div class="content">
      <div class="card">
        <div class="field-row">
          <div class="field-label">Applicant Name:</div>
          <div class="field-val"><strong>${cleanName}</strong></div>
        </div>
        <div class="field-row">
          <div class="field-label">Applicant Email:</div>
          <div class="field-val"><a href="mailto:${cleanEmail}" style="color:#38bdf8;">${cleanEmail}</a></div>
        </div>
        <div class="field-row">
          <div class="field-label">Trading Focus:</div>
          <div class="field-val">${cleanNote ? cleanNote.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<em>None provided</em>'}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Submitted At:</div>
          <div class="field-val">${timestampFormatted}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Client IP:</div>
          <div class="field-val"><code style="font-size:11px; color:#cbd5e1;">${clientIp}</code></div>
        </div>
      </div>

      <div class="actions">
        <a href="https://daily-stock-analysis-89j.pages.dev/admin/users" class="btn-primary" target="_blank">
          Open Admin Console to Provision User
        </a>
        <a href="mailto:${cleanEmail}?subject=DeltaHarvest%20Login%20Credentials" class="btn-secondary">
          Reply to Applicant
        </a>
      </div>
    </div>
    <div class="footer">
      DeltaHarvest Platform &bull; Multi-Tenant Living Trust & Options Analytics &bull; Notification for Super-Administrator (${adminEmail})
    </div>
  </div>
</body>
</html>`;

    let emailDelivered = false;
    const deliveryMethods = [];

    // Protocol 1: Cloudflare Pages / Workers Email Routing Binding (env.SEND_EMAIL or env.EMAIL)
    try {
      const emailBinding = env.SEND_EMAIL || env.EMAIL;
      if (emailBinding && typeof emailBinding.send === "function") {
        await emailBinding.send({
          from: "no-reply@daily-stock-analysis-89j.pages.dev",
          to: adminEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        emailDelivered = true;
        deliveryMethods.push("Cloudflare Email Routing Binding");
      }
    } catch (e) {
      console.warn("[request-access] Cloudflare Email binding failed:", e);
    }

    // Protocol 2: Transactional Email via MailChannels API
    if (!emailDelivered) {
      try {
        const mcResp = await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: adminEmail, name: "Frank Maresca" }],
              },
            ],
            from: {
              email: "no-reply@daily-stock-analysis-89j.pages.dev",
              name: "DeltaHarvest Onboarding",
            },
            reply_to: {
              email: cleanEmail,
              name: cleanName,
            },
            subject,
            content: [
              {
                type: "text/html",
                value: htmlContent,
              },
              {
                type: "text/plain",
                value: textContent,
              },
            ],
          }),
        });

        if (mcResp.ok || mcResp.status === 202) {
          emailDelivered = true;
          deliveryMethods.push("MailChannels Gateway");
        } else {
          console.warn("[request-access] MailChannels status:", mcResp.status);
        }
      } catch (e) {
        console.warn("[request-access] MailChannels dispatch failed:", e);
      }
    }

    // Protocol 3: Resend REST API (if env.RESEND_API_KEY is configured)
    if (!emailDelivered && env.RESEND_API_KEY) {
      try {
        const resendResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "DeltaHarvest <onboarding@resend.dev>",
            to: [adminEmail],
            reply_to: cleanEmail,
            subject,
            html: htmlContent,
            text: textContent,
          }),
        });
        if (resendResp.ok) {
          emailDelivered = true;
          deliveryMethods.push("Resend API");
        }
      } catch (e) {
        console.warn("[request-access] Resend API failed:", e);
      }
    }

    // Protocol 4: SendGrid REST API (if env.SENDGRID_API_KEY is configured)
    if (!emailDelivered && env.SENDGRID_API_KEY) {
      try {
        const sgResp = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.SENDGRID_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: adminEmail }] }],
            from: { email: "no-reply@daily-stock-analysis-89j.pages.dev", name: "DeltaHarvest" },
            reply_to: { email: cleanEmail, name: cleanName },
            subject,
            content: [{ type: "text/html", value: htmlContent }],
          }),
        });
        if (sgResp.ok || sgResp.status === 202) {
          emailDelivered = true;
          deliveryMethods.push("SendGrid API");
        }
      } catch (e) {
        console.warn("[request-access] SendGrid API failed:", e);
      }
    }

    // Protocol 5: Webhook dispatch (if env.ADMIN_NOTIFICATION_WEBHOOK is configured)
    if (env.ADMIN_NOTIFICATION_WEBHOOK) {
      try {
        await fetch(env.ADMIN_NOTIFICATION_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "user.credential_request",
            name: cleanName,
            email: cleanEmail,
            note: cleanNote,
            timestamp: timestampIso,
            clientIp,
            adminEmail,
          }),
        });
        deliveryMethods.push("Admin Notification Webhook");
      } catch (e) {
        console.warn("[request-access] Webhook notification failed:", e);
      }
    }

    // Protocol 6: Cloudflare D1 Database Request Audit Storage
    if (env.DB) {
      try {
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS access_requests (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT NOT NULL,
            note TEXT,
            client_ip TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at TEXT DEFAULT (DATETIME('now'))
          )`
        ).run();

        const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await env.DB.prepare(
          `INSERT INTO access_requests (id, name, email, note, client_ip) VALUES (?, ?, ?, ?, ?)`
        ).bind(reqId, cleanName, cleanEmail, cleanNote, clientIp).run();
        deliveryMethods.push("D1 Audit Ledger");
      } catch (e) {
        console.warn("[request-access] D1 table write failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Your login request has been registered and an automated notification was transmitted to Frank Maresca (${adminEmail}).`,
        applicant: {
          name: cleanName,
          email: cleanEmail,
        },
        delivery: {
          adminEmail,
          delivered: emailDelivered,
          protocols: deliveryMethods,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[request-access] Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error processing access request." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
