const crypto = require("crypto");
const key = Buffer.from(process.env.DB_ENCRYPTION_KEY, "hex");

/**
 * @param {string} content
 * @returns {string}
 */
exports.encrypt = (content) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  });
};

/**
 * @param {string} encrypted
 * @returns {Promise<string>}
 */
exports.decrypt = (encrypted) => {
  return new Promise((resolve, reject) => {
    try {
      const json = JSON.parse(encrypted);
      const { iv, content } = json;
      const decipher = crypto.createDecipheriv(
        "aes-256-ctr",
        key,
        Buffer.from(iv, "hex")
      );
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(content, "hex")),
        decipher.final(),
      ]);
      return resolve(decrypted.toString());
    } catch (error) {
      return reject(error);
    }
  });
};
