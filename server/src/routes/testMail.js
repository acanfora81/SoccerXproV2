// server/src/routes/testMail.js
const express = require("express");
const router = express.Router();
const { sendMail } = require("../utils/mailer.js");

// Test invio email
router.post("/test-mail", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: "Campo 'to' mancante nel body" });
    }

    await sendMail({
      to,
      subject: "✅ Test invio email da Soccer X Pro",
      html: `
        <h2>Funziona 🎉</h2>
        <p>Questa è un'email di test inviata da <b>Soccer X Pro</b>.</p>
        <p>Data: ${new Date().toLocaleString()}</p>
      `,
    });

    res.json({ success: true, message: `Email inviata correttamente a ${to}` });
  } catch (err) {
    console.error("Errore test-mail:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
