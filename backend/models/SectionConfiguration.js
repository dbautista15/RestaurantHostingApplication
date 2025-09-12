// backend/models/SectionConfiguration.js
const mongoose = require('mongoose');

/**
 * 🎯 SHIFT CONFIGURATION MODEL
 * Manages how tables are distributed across sections based on staffing
 */
const sectionConfigurationSchema = new mongoose.Schema({
  shiftName: {
    type: String,
    required: true,
    enum: [ 'four', 'five', 'six', 'seven']
  },
  
  // Number of servers working this shift
  serverCount: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  
  // Which sections are active for this shift
  activeSections: [{
    sectionNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    // Which tables are assigned to this section during this shift
    assignedTables: [{
      type: String, // Table numbers like "T1", "T2", etc.
      required: true
    }],
    // How many servers are assigned to this section
    serverCount: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: false
  },
  
  // Notes about this configuration
  notes: String
  
}, {
  timestamps: true
});

// Only one configuration can be active at a time
sectionConfigurationSchema.pre('save', async function(next) {
  if (this.isActive) {
    // Deactivate all other configurations
    await mongoose.model('SectionConfiguration').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const SectionConfiguration = mongoose.model('SectionConfiguration', sectionConfigurationSchema);
module.exports = SectionConfiguration;