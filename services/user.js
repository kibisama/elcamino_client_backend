const User = require("../schemas/user");

const Patient = require("../schemas/patient");
const Rx = require("../schemas/rx");

(async function () {
  try {
    if (!(await Patient.findOne())) {
      await Patient.create({
        patientLastName: "test",
        patientID: "1",
        patientFirstName: "test",
      });
    }
  } catch (e) {
    console.error(e);
  }
})();
(async function () {
  try {
    const pt = await Patient.findOne();
    console.log("pT!!!!!!!!", pt);
    const rx = await Rx.create({ rxID: "1", patient: pt._id });
    await rx.populate("patient");
    console.log(rx);
  } catch (e) {
    console.error(e);
  }
})();

/**
 * @param {string|import("mongoose").ObjectId} _id
 * @returns {Proimse<{id: string, name: string, stationCodes: [string]}>}
 */
exports.getUser = async (_id) => {
  if (!_id) {
    throw { status: 400 };
  }
  const user = await User.findById(_id);
  if (user) {
    return {
      id: user.username,
      name: user.name,
      stationCodes: user.stationCodes,
    };
  } else {
    throw { status: 404 };
  }
};
