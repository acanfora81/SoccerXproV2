// server/src/services/EmailService.js
const { sendMail } = require('../utils/mailer');

class EmailService {
  static async sendRegistrationPending({ email, name, plan, paymentUrl }) {
    await sendMail({
      to: email,
      subject: 'Conferma registrazione - completa il pagamento',
      html: `
        <h2>Ciao ${name},</h2>
        <p>la tua registrazione a <strong>Soccer X Pro</strong> con piano <strong>${plan}</strong> è stata creata.</p>
        <p>Per attivare l'account, completa il pagamento cliccando qui:</p>
        <p><a href="${paymentUrl}" target="_blank" rel="noopener">Completa il pagamento</a></p>
        <p>Grazie!</p>
      `
    });
  }
}

module.exports = EmailService;


