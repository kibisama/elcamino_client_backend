const crypto = require("crypto");
const aesKey = Buffer.from(process.env.DB_ENCRYPTION_KEY, "hex");
const fs = require("fs");
const privateKey = fs.readFileSync("./private.pem").toString("utf-8");

/**
 * @param {string} data
 * @returns {string}
 */
exports.encryptDB = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return JSON.stringify({
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
  });
};

/**
 * @param {string} encrypted
 * @returns {Promise<string>}
 */
exports.decryptDB = (encrypted) =>
  new Promise((resolve, reject) => {
    try {
      const json = JSON.parse(encrypted);
      const { iv, data } = json;
      const decipher = crypto.createDecipheriv(
        "aes-256-ctr",
        aesKey,
        Buffer.from(iv, "hex")
      );
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(data, "hex")),
        decipher.final(),
      ]);
      return resolve(decrypted.toString());
    } catch (error) {
      return reject(error);
    }
  });

/**
 * @param {string} key
 * @returns {Buffer}
 */
exports.decryptKey = (key) => {
  const keyBuffer = Buffer.from(key, "hex");
  return crypto.privateDecrypt({ key: privateKey }, keyBuffer);
};

/**
 * @param {string} data
 * @param {Buffer} key
 * @param {string} iv
 * @returns {Promise<string>}
 */
exports.decryptData = (data, key, iv) =>
  new Promise((resolve, reject) => {
    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-ctr",
        key,
        Buffer.from(iv, "hex")
      );
      const decrypted = decipher.update(Buffer.from(data, "hex"));
      return resolve(JSON.parse(decrypted.toString()));
    } catch (error) {
      return reject(error);
    }
  });
