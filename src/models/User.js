const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    fullName: {
      type: String,
      required: [true,'fullName is required'],
      trim: true,
      maxlength: 50,
    },

    // Unique Email
    email: {
      type: String,
      required: true,
      unique: true, // Important for bulk insert conflict handling
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
    },

    // Optional Phone
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows null values but enforces uniqueness when present
      match: [/^[0-9]{10,15}$/, "Invalid phone number"],
      index: true,
    },

    walletBalance:{
      type:Number,
      default:0,
      min:[0,'WalletBalance Cannot be Negative']
    },

    isBlocked:{
      type:Boolean,
      default:false
    },

    // Status for bulk updates
    kycStatus: {
      type: String,
      enum:
      {
        values:["active", "inactive", "blocked"],
        message:'value is not supported'
      } 
      ,
      default: "active",
      index: true,
    },

    // Role-based access
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
      index: true,
    },

    // Metadata for tracking
    age: {
      type: Number,
      min: 0,
      max: 120,
    },

    // Address (nested object)
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    // Soft delete support (important for bulk ops)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Bulk operation tracking
    batchId: {
      type: String, // identify which bulk request inserted the user
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

userSchema.index({kycStatus: 1, isBlocked: 1});

const User = mongoose.model('User',userSchema);
module.exports = User;