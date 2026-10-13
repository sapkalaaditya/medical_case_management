const mongoose = require('mongoose');

const CASE_STATUSES = ['Draft', 'Planning', 'In Review', 'Approved', 'Completed', 'Cancelled'];
const CASE_PRIORITIES = ['Low', 'Medium', 'High'];

const caseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      unique: true,
      trim: true,
      match: [/^CASE-\d{4,}$/, 'Case number must match format CASE-0001 (CASE- followed by at least 4 digits)']
    },
    patientReference: {
      type: String,
      required: [true, 'Patient reference is required'],
      trim: true,
      maxlength: [50, 'Patient reference cannot exceed 50 characters']
    },
    surgeonName: {
      type: String,
      required: [true, 'Surgeon name is required'],
      trim: true,
      maxlength: [100, 'Surgeon name cannot exceed 100 characters']
    },
    implantType: {
      type: String,
      required: [true, 'Implant type is required'],
      trim: true,
      maxlength: [100, 'Implant type cannot exceed 100 characters']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: CASE_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      index: true
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: CASE_PRIORITIES,
        message: '{VALUE} is not a valid priority'
      }
    },
    surgeryDate: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user reference is required']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Secondary compound/sorting index for fast pagination
caseSchema.index({ createdAt: -1 });

const Case = mongoose.model('Case', caseSchema);

module.exports = {
  Case,
  CASE_STATUSES,
  CASE_PRIORITIES
};
