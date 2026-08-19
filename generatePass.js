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

  const certificates = { wwdr, signerCert, signerKey };
  if (process.env.CERT_PASSPHRASE) {
    certificates.signerKeyPassphrase = process.env.CERT_PASSPHRASE;
  }

  const pass = await PKPass.from(
    {
      model: path.join(__dirname, "mia-dose.pass"),
      certificates,
    },
       {
      serialNumber: customerId,
      description: `Mia Dose Loyalty Card - ${customerName}`,
      passTypeIdentifier: "pass.com.mycompany.miadose",
      teamIdentifier: "35BT9NFCL5",
      organizationName: "Mia Dose",
      backgroundColor: "rgb(255, 255, 255)",
      foregroundColor: "rgb(20, 20, 20)",
      labelColor: "rgb(90, 90, 90)",
    }
  );
    pass.type = "storeCard";

  pass.headerFields.push({ key: "name", label: "NAME", value: customerName });
  pass.secondaryFields.push({
    key: "brand",
    label: "Share an experience",
    value: "Mia Dose",
    textAlignment: "PKTextAlignmentLeft",
  });
  pass.setBarcodes({
    message: customerId,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer();
}

module.exports = { generatePass };
