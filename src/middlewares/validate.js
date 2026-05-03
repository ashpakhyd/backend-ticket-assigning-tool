// src/middlewares/validate.js
module.exports = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    const errors = e.errors?.map(err => ({
      field: err.path.join("."),
      message: err.message
    }));
    res.status(400).json({ message: "Validation failed", errors });
  }
};
  