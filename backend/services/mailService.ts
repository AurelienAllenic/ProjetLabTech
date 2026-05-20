import { sendMail } from "../lib/mailer.js";

export async function sendPasswordSetupEmail(
  toEmail: string,
  displayName: string,
  token: string,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost";
  const resetUrl = `${frontendUrl}/set-password?token=${token}`;

  await sendMail({
    to: toEmail,
    subject: "Bienvenue — Définissez votre mot de passe",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>Bonjour ${displayName},</h2>
        <p>Un compte a été créé pour vous sur la plateforme LabIA.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe :</p>
        <p style="text-align:center;margin:32px 0">
          <a href="${resetUrl}"
             style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
            Définir mon mot de passe
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          Ce lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
        </p>
      </div>
    `,
  });
}
