require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { generatePass } = require("./generatePass");

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check — افتحه في المتصفح للتأكد إن السيرفر شغال
app.get("/", (req, res) => {
  res.send("Mia Dose Wallet server is running ✅");
});

/**
 * Endpoint اللي FlutterFlow راح يناديه.
 * يستقبل: customerName, customerId (يستخدم كباركود)
 * يرجع: ملف .pkpass جاهز للتحميل / يفتح Apple Wallet مباشرة
 *
 * مثال استدعاء:
 * GET /generate-pass?name=Ahmad&id=12345
 */
app.get("/generate-pass", async (req, res) => {
  try {
    const { name, id } = req.query;

    if (!name || !id) {
      return res.status(400).json({
        error: "لازم تبعث name و id في الرابط. مثال: /generate-pass?name=Ahmad&id=12345",
      });
    }

    const buffer = await generatePass({ customerName: name, customerId: id });

    res.set({
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename=mia-dose-${id}.pkpass`,
    });
    res.send(buffer);
  } catch (err) {
    console.error("خطأ أثناء توليد البطاقة:", err);
    res.status(500).json({ error: "فشل توليد البطاقة", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`السيرفر شغال على المنفذ ${PORT}`);
});
