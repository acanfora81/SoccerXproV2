// ===============================================================
// 📬 MAILER UNIVERSALE - Athlos / Soccer X Pro
// Percorso: server/src/utils/mailer.js
// ---------------------------------------------------------------
// Gestisce l'invio email tramite:
//   🔹 Brevo (Sendinblue) come provider principale
//   🔹 Gmail (SMTP) come fallback automatico
// ===============================================================

const nodemailer = require("nodemailer");
const SibApiV3Sdk = require("@getbrevo/brevo");

// ===============================================================
// 📦 CONFIGURAZIONE DI BASE
// ===============================================================
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Soccer X Pro";
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER;

// ===============================================================
// 🔹 Invio tramite BREVO (API)
// ===============================================================
async function sendWithBrevo(to, subject, html) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("Chiave BREVO_API_KEY mancante nel file .env");
  }

  const client = new SibApiV3Sdk.TransactionalEmailsApi();
  client.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

  const emailData = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  await client.sendTransacEmail(emailData);
  console.log(`✅ Email inviata via Brevo a ${to}`);
}

// ===============================================================
// 🔸 Invio tramite Gmail (SMTP) - fallback automatico
// ===============================================================
async function sendWithGmail(to, subject, html) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("Credenziali Gmail mancanti (SMTP_USER/SMTP_PASS)");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email inviata via Gmail a ${to}`);
}

// ===============================================================
// 🚀 Funzione principale con fallback
// ===============================================================
async function sendMail({ to, subject, html }) {
  try {
    if (!to) throw new Error("Destinatario mancante");

    // Prova prima con Brevo
    if (process.env.BREVO_API_KEY) {
      await sendWithBrevo(to, subject, html);
      return;
    }

    // Se Brevo non disponibile, usa Gmail
    await sendWithGmail(to, subject, html);
  } catch (error) {
    console.error("❌ Errore durante l'invio email:", error.message);

    // Tentativo di fallback su Gmail se Brevo fallisce
    if (!error.message.includes("Gmail") && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        console.log("🔄 Tentativo fallback su Gmail...");
        await sendWithGmail(to, subject, html);
      } catch (fallbackErr) {
        console.error("❌ Fallback Gmail fallito:", fallbackErr.message);
        throw fallbackErr;
      }
    } else {
      throw error;
    }
  }
}

// ===============================================================
// 📤 ESPORTAZIONE
// ===============================================================
module.exports = { sendMail };
