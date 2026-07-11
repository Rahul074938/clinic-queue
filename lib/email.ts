import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "ClinicQueue <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  console.log(`[EMAIL SENDING] to: ${to}, subject: ${subject}`);
  console.log(`[EMAIL BODY]:\n${html.replace(/<[^>]*>/g, " ").trim()}`);

  if (!resend) {
    console.log("[EMAIL NOTE] Resend API key not configured, skipped actual delivery. (Logged to console/stdout for demo)");
    return { success: true, id: "mock-email-id" };
  }

  try {
    const data = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });
    
    if (data.error) {
      console.error("Resend error:", data.error);
      return { success: false, error: data.error };
    }
    
    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error("Failed to send email via Resend:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}
