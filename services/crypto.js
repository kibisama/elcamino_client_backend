const crypto = require("crypto");
const aesKey = Buffer.from(process.env.DB_ENCRYPTION_KEY, "hex");
const fs = require("fs");
const privateKey = fs.readFileSync("./private.pem").toString("utf-8");
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmPz2mMWDnPc1soPwdzqp
Fn6Gvbw61apM0fhdBneXZZgLOVyJ4jzcJxVuS2/XM5Q/JUKevSksyBd9SBOmgQDZ
fn+G0fH508NXWb1nLTS67oOQ2sX/s/vrHyxiWgn3pQPRYUrMCpbYOxOI/nT7sU9l
3mLOD2KHebFTpy2VCqD7Qy54uF/VfTYxNAEa36IHjpJsKBORVHMweGs3ioHog/d7
Y8GVjItypaxREKBMk5p2EsvQlD9yzcr7WtAsrRDQRpsDlfHvqgDg9yMrndppFnSw
bHxm1QqU1VF3hbV47SXeXNyhI1/4pETMzjVmOqjBzNEuvxYk+ACm1uCCoWyww9Tr
SwIDAQAB
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
        Buffer.from(iv, "hex"),
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
        Buffer.from(iv, "hex"),
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
