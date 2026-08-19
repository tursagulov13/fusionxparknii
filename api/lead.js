const SECTOR_LABELS = {
  integrator: 'Системный интегратор',
  nii: 'НИИ',
  other: 'Другое'
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const body = req.body || {};
  const isPartner = body.type === 'partner';

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.status(500).json({ ok: false, error: 'telegram_not_configured' });
    return;
  }

  let lines;

  if (isPartner) {
    const { firstName, lastName, phone, email } = body;

    if (!firstName || !String(firstName).trim() || !lastName || !String(lastName).trim() || !phone || !String(phone).trim()) {
      res.status(400).json({ ok: false, error: 'missing_required_fields' });
      return;
    }

    lines = [
      '<b>Новая заявка — Стать партнёром</b>',
      '',
      '<b>Имя:</b> ' + escapeHtml(firstName),
      '<b>Фамилия:</b> ' + escapeHtml(lastName),
      '<b>Телефон:</b> ' + escapeHtml(phone)
    ];
    if (email && String(email).trim()) {
      lines.push('<b>Email:</b> ' + escapeHtml(email));
    }
  } else {
    const { fio, phone, sector, email } = body;

    if (!fio || !String(fio).trim() || !phone || !String(phone).trim()) {
      res.status(400).json({ ok: false, error: 'missing_required_fields' });
      return;
    }

    lines = [
      '<b>Новая заявка — FusionXpark</b>',
      '',
      '<b>ФИО:</b> ' + escapeHtml(fio),
      '<b>Телефон:</b> ' + escapeHtml(phone)
    ];
    if (sector && SECTOR_LABELS[sector]) {
      lines.push('<b>Сектор:</b> ' + escapeHtml(SECTOR_LABELS[sector]));
    }
    if (email && String(email).trim()) {
      lines.push('<b>Email:</b> ' + escapeHtml(email));
    }
  }

  try {
    const tgRes = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML'
      })
    });

    if (!tgRes.ok) {
      res.status(502).json({ ok: false, error: 'telegram_send_failed' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: 'telegram_send_failed' });
  }
};
