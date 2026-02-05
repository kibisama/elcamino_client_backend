/**
 * @param {object} obj1
 * @param {object} obj2
 * @returns {boolean}
 */
exports.compareFields = (obj1, obj2) => {
  for (const key in obj1) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (
      typeof val1 === "object" &&
      val1 !== null &&
      typeof val2 === "object" &&
      val2 !== null
    ) {
      if (!compareFields(val1, val2)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }
  return true;
};
