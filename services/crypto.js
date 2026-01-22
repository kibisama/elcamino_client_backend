const crypto = require("crypto");
const aesKey = Buffer.from(process.env.DB_ENCRYPTION_KEY, "hex");
const fs = require("fs");
const privateKey = fs.readFileSync("./private.pem").toString("utf-8");
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm1fh+/tk63iQG+qwMgys
dZ+YROxxdMg/+B+T3WlnMFM2qFsNrRfU0rk2oTieEQJAlQCnHq/sA7wzKkYsJxhi
HHJZgbV13J8+jpQZ7yd92bFtR/DWYJj0djhfnnXbyLrY69qInGU1sZMeD95vqCcb
DnlODVkWD9JC5vG1JUPqSRnN/xH7u1M8x4gKnSqjcdIi/peFSyqe9EXIAjEc6a0k
Sh5EAmzgiYjvHXgRGQ5wUVi9opYd3VD+JHVytIlrRa7foIYC+tHud8JhdjCx7VKq
SR4slatDVZZFR791YYauGb2oMyg9WEaAO3tDzl7UBM2D25y/7RfocyYm6NZGukOJ
GwIDAQAB
-----END PUBLIC KEY-----`;

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
 * @returns {Promise<*>}
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

/**
 * @param {*} data
 * @returns {{data: string, key: string, iv: string}}
 */
exports.encryptData = (data) => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);
  const encryptedData = Buffer.concat([
    cipher.update(JSON.stringify(data)),
    cipher.final(),
  ]);
  const encryptedKey = crypto.publicEncrypt({ key: publicKey }, key);
  return {
    data: encryptedData.toString("hex"),
    key: encryptedKey.toString("hex"),
    iv: iv.toString("hex"),
  };
};
