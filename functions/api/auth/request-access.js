import { onRequestPost as handleInquiryPost } from "../admin/inquiries.js";

/**
 * Cloudflare Pages Function: POST /api/auth/request-access
 * Seamlessly routes to the unified admin inquiries pipeline.
 */
export async function onRequestPost(context) {
  return handleInquiryPost(context);
}
