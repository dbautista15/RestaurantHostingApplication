// backend/models/AuditEvent.js
const mongoose = require("mongoose");

/**
 * ✅ COMPLETED: Audit Event Schema
 * Simple event logging for restaurant transparency
 */
const auditEventSchema = new mongoose.Schema(
  {
    // ✅ COMPLETED: Define event type field
    eventType: {
      type: String,
      required: true,
      enum: [
        "STATE_TRANSITION",
        "TABLE_MOVED", // Table state changes
        "ASSIGNMENT", // Party assignments
        "WAITLIST_ADD", // New party added
        "WAITLIST_REMOVE", // Party removed/seated
        "LOGIN", // User login
        "SHIFT_START", // Waiter shift start
        "SHIFT_END", // Waiter shift end
      ],
    },

    // ✅ COMPLETED: Define tableId reference
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: false, // Not all events are table-related
    },

    // ✅ COMPLETED: Define userId reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Who performed the action
    },

    // ✅ COMPLETED: Define state transition fields
    fromState: {
      type: String,
      required: false, // Only for state transitions
    },

    toState: {
      type: String,
      required: false, // Only for state transitions
    },

    // ✅ COMPLETED: Define metadata field
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: {},
      // Examples: { partySize: 4, waiterInfo: {...}, reason: "customer request" }
    },

    // ✅ COMPLETED: Add IP address and device info for security
    ipAddress: {
      type: String,
      required: false,
    },

    deviceInfo: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    // Make events immutable after creation
  }
);

// ✅ COMPLETED: Add indexes for common queries
auditEventSchema.index({ tableId: 1, createdAt: -1 }); // Table history queries
auditEventSchema.index({ userId: 1, createdAt: -1 }); // User activity queries
auditEventSchema.index({ eventType: 1, createdAt: -1 }); // Event type queries
auditEventSchema.index({ createdAt: -1 }); // Recent events

// ✅ COMPLETED: Add static methods for common audit queries
auditEventSchema.statics.getTableHistory = function (tableId, limit = 50) {
  return this.find({ tableId })
    .populate("userId", "userName role clockInNumber")
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditEventSchema.statics.getUserActivity = function (
  userId,
  startDate,
  endDate
) {
  const query = { userId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .populate("tableId", "tableNumber section")
    .sort({ createdAt: -1 });
};

// ✅ COMPLETED: Get recent events for transparency
auditEventSchema.statics.getRecentEvents = function (limit = 100) {
  return this.find({})
    .populate("userId", "userName role")
    .populate("tableId", "tableNumber section")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Prevent modification of audit events after creation
auditEventSchema.pre("save", function (next) {
  if (!this.isNew) {
    const error = new Error("Audit events cannot be modified after creation");
    return next(error);
  }
  next();
});

const AuditEvent = mongoose.model("AuditEvent", auditEventSchema);
module.exports = AuditEvent;
