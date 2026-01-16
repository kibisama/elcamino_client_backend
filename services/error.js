exports.handleMongoError = (error) => {
  const { name, code } = error;
  switch (code) {
    // duplicate key error
    case 11000:
      throw { status: 409 };
    default:
  }

  switch (name) {
    // validation error
    case "ValidationError":
      throw { status: 400 };
    default:
  }

  throw error;
};
