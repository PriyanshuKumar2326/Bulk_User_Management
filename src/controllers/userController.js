const User = require("../models/User");

// ================================
// BULK CREATE USERS
// ================================
exports.bulkCreate = async (req, res) => {
  try {
    const users = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array",
      });
    }

    const validUsers = [];
    const validationErrors = [];

    // ✅ Pre-validation (NO DB HIT)
    for (let i = 0; i < users.length; i++) {
      try {
        const doc = new User(users[i]);
        await doc.validate();
        validUsers.push(users[i]);
      } catch (err) {
        validationErrors.push({
          index: i,
          errors: Object.values(err.errors).map(e => e.message),
        });
      }
    }

    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All records failed validation",
        validationErrors,
      });
    }

    let insertedCount = 0;
    let dbErrors = [];

    try {
      const result = await User.insertMany(validUsers, {
        ordered: false,
      });
      insertedCount = result.length;
    } catch (error) {
      // ✅ Handle partial DB errors (duplicate etc.)
      insertedCount = error.result?.nInserted || 0;

      dbErrors = error.writeErrors?.map(err => ({
        index: err.index,
        message:
          err.err?.message ||
          err.errmsg ||
          "Database error",
        code: err.code,
        field: err.err?.keyValue || null,
      })) || [];
    }

    return res.status(201).json({
      success: true,
      message: "Bulk insert processed",
      insertedCount,
      validationFailed: validationErrors.length,
      dbFailed: dbErrors.length,
      validationErrors,
      dbErrors,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ================================
// BULK UPDATE USERS
// ================================
exports.bulkUpdate = async (req, res) => {
  try {
    const userData = req.body;

    if (!Array.isArray(userData) || userData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array",
      });
    }

    const bulkOperations = [];
    const failedOperations = [];

    userData.forEach((data, index) => {
      // ✅ Must have identifier
      if (!data.email && !data.phone && !data._id) {
        failedOperations.push({
          index,
          message: "Missing identifier (email/phone/_id)",
        });
        return;
      }

      const filter = {};
      if (data.email) filter.email = data.email;
      else if (data.phone) filter.phone = data.phone;
      else if (data._id) filter._id = data._id;

      const updateData = { ...data };
      delete updateData._id;

      // ✅ Prevent updating unique fields
      delete updateData.email;
      delete updateData.phone;

      updateData.updatedAt = new Date();

      bulkOperations.push({
        updateOne: {
          filter,
          update: { $set: updateData },
          upsert: false,
        },
      });
    });

    if (bulkOperations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates to perform",
        failedOperations,
      });
    }

    let result;
    let dbErrors = [];

    try {
      result = await User.bulkWrite(bulkOperations, {
        ordered: false,
      });
    } catch (error) {
      dbErrors = error.writeErrors?.map(err => ({
        index: err.index,
        message:
          err.err?.message ||
          err.errmsg ||
          "Database error",
        code: err.code,
      })) || [];

      result = error.result || {};
    }

    return res.status(200).json({
      success: true,
      message: "Bulk update processed",
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      failedOperations,
      dbErrors,
    });

  } catch (err) {
    console.error("Bulk Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};