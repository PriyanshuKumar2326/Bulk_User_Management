const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50,
    },

    // Unique Email
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
    },

    // Optional Phone
    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^[0-9]{10,15}$/, "Invalid phone number"],
      index: true,
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    kycStatus: {
      type: String,
      enum: {
        values: ["active", "inactive", "blocked"],
        message: "Invalid kycStatus",
      },
      default: "active",
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
      index: true,
    },

    age: {
      type: Number,
      min: 0,
      max: 120,
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    batchId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// ✅ Virtual Field (INTERVIEW FAVORITE 🔥)
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});


// ✅ Compound Index
userSchema.index({ kycStatus: 1, isBlocked: 1 });


// ✅ Remove sensitive/unwanted fields (optional)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = User;