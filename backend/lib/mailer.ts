import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "LabIA <onboarding@resend.dev>",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
