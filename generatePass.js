const path = require("path");
const fs = require("fs");
const { PKPass } = require("passkit-generator");

/**
 * يولّد بطاقة Apple Wallet (pkpass) لعميل واحد.
 * @param {Object} params
 * @param {string} params.customerName - اسم العميل يظهر على البطاقة
 * @param {string} params.customerId - رقم/كود العميل، يستخدم كقيمة الباركود
 * @returns {Promise<Buffer>} ملف الـ pkpass كـ Buffer جاهز للإرسال
 */
async function generatePass({ customerName, customerId }) {
  // هذي الشهادات لازم تجيبها من حساب Apple Developer حقك
  // (اشرح لك بالتفصيل بالـ README كيف تسويها)
  const wwdr = fs.readFileSync(path.join(__dirname, "certs", "wwdr.pem"));
  const signerCert = fs.readFileSync(path.join(__dirname, "certs", "signerCert.pem"));
  const signerKey = fs.readFileSync(path.join(__dirname, "certs", "signerKey.pem"));

  const pass = await PKPass.from(
    {
      model: path.join(__dirname, "mia-dose.pass"), // مجلد التصميم (موديل البطاقة)
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: process.env.CERT_PASSPHRASE || "",
      },
    },
    {
      // بيانات خاصة بهذا العميل بالذات
      serialNumber: customerId,
      description: `Mia Dose Loyalty Card - ${customerName}`,
    }
  );

  // اسم العميل يطلع مرتين بالتصميم: فوق (NAME) وبالنص (FIRST NAME)
  pass.headerFields.push({
    key: "name",
    label: "NAME",
    value: customerName,
  });

  pass.primaryFields.push({
    key: "forename",
    label: "FIRST NAME",
    value: customerName,
  });

  // الباركود — القيمة اللي يقرأها الكاشير (نفس فكرة QR داخل تطبيقكم)
  pass.setBarcodes({
    message: customerId,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer();
}

module.exports = { generatePass };
