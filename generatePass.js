const path = require("path");
const fs = require("fs");
const { PKPass } = require("passkit-generator");

async function generatePass({ customerName, customerId }) {
  const certsDir = fs.existsSync("/etc/secrets/wwdr.pem")
    ? "/etc/secrets"
    : path.join(__dirname, "certs");

  const wwdr = fs.readFileSync(path.join(certsDir, "wwdr.pem"));
  const signerCert = fs.readFileSync(path.join(certsDir, "signerCert.pem"));
  const signerKey = fs.readFileSync(path.join(certsDir, "signerKey.pem"));

  const pass = await PKPass.from(
    {
      model: path.join(__dirname, "mia-dose.pass"),
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: process.env.CERT_PASSPHRASE || "",
      },
    },
    {
      serialNumber: customerId,
      description: `Mia Dose Loyalty Card - ${customerName}`,
    }
  );

  pass.headerFields.push({ key: "name", label: "NAME", value: customerName });
  pass.primaryFields.push({ key: "forename", label: "FIRST NAME", value: customerName });

  pass.setBarcodes({
    message: customerId,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer();
}

module.exports = { generatePass };
