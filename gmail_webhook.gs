/**
 * Sahobalar sayti va Musiqa bot — Gmail Webhook (Google Apps Script)
 *
 * Render bepul tarifida SMTP portlari (25/465/587) yopiq. Shu sababli
 * hisobotni Gmail orqali yuborish uchun shu webhook ishlatiladi.
 * Vercel sayti ham xuddi shu webhook orqali xat yuborishi mumkin.
 *
 * O'rnatish:
 * 1. https://script.google.com → "New project".
 * 2. Quyidagi kodni Code.gs ichiga qo'ying.
 * 3. SECRET ni uzun tasodifiy matnga o'zgartiring.
 * 4. Deploy → New deployment → Web app:
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Chiqqan URL ni nusxalang.
 * 6. Vercel (sahobalar) va Render (musiqa-bot) → Environment:
 *      GMAIL_WEBHOOK_URL    = <URL>
 *      GMAIL_WEBHOOK_SECRET = <SECRET bilan bir xil>
 *      REPORT_TO            = hisobot keladigan Gmail
 * 7. Qayta deploy qiling.
 *
 * Tekshirish: URL ni brauzerda ochsangiz {"ok":true,...} chiqishi kerak.
 */

var SECRET = 'BU_YERGA_UZUN_TASODIFIY_KALIT';

function doGet() {
  return jsonReply({ ok: true, service: 'musiqa-bot-gmail' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonReply({ ok: false, error: 'empty request' });
    }

    var data = JSON.parse(e.postData.contents);
    if (!data.secret || data.secret !== SECRET) {
      return jsonReply({ ok: false, error: 'unauthorized' });
    }
    if (!data.to || !data.subject) {
      return jsonReply({ ok: false, error: 'to/subject required' });
    }

    var options = { name: data.fromName || 'Musiqa bot' };
    if (data.html) options.htmlBody = data.html;

    GmailApp.sendEmail(data.to, data.subject, data.text || '', options);
    return jsonReply({ ok: true, sent: true });
  } catch (err) {
    return jsonReply({ ok: false, error: String(err) });
  }
}

function jsonReply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}
