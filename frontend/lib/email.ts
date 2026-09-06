import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/emails/verification-email";
import { PasswordResetEmail } from "@/emails/password-reset-email";

const CODE_EXPIRY_MINUTES = 5;
export const RESET_TOKEN_EXPIRY_MINUTES = 30;

const smtpConfig = {
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: (process.env.MAIL_ENCRYPTION || "").toLowerCase() === "ssl",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
};

const transporter: Transporter | null = smtpConfig.auth.user && smtpConfig.auth.pass
  ? nodemailer.createTransport(smtpConfig)
  : null;

const fromAddress = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USERNAME || "noreply@localhost";
const fromName = process.env.MAIL_FROM_NAME || "AcademiaHub";
const from = `"${fromName}" <${fromAddress}>`;

function missingConfigError(): Error {
  return new Error(
    "Email is not configured. Set MAIL_USERNAME and MAIL_PASSWORD in the environment to send email."
  );
}

export async function sendVerificationEmail(email: string, code: string) {
  if (!transporter) throw missingConfigError();

  const html = await render(
    VerificationEmail({ code, expiresInMinutes: CODE_EXPIRY_MINUTES })
  );

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your email - AcademiaHub",
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!transporter) throw missingConfigError();

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = await render(PasswordResetEmail({ resetUrl }));

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your password - AcademiaHub",
    html,
  });
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getCodeExpiry(): Date {
  return new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
}

export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
}
