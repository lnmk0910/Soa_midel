const { mongoose } = require('../config/db');

const tuitionSchema = new mongoose.Schema({
  tuition_fee_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20
  },
  student_id: {
    type: String,
    required: true,
    maxlength: 10
  },
  student_name: {
    type: String,
    required: true,
    maxlength: 100
  },
  semester: {
    type: String,
    required: true,
    maxlength: 20
  },
  academic_year: {
    type: String,
    required: true,
    maxlength: 10
  },
  tuition_amount: {
    type: Number,
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: 'UNPAID',
    enum: ['PAID', 'UNPAID', 'OVERDUE']
  }
}, {
  timestamps: true
});

const Tuition = mongoose.model('Tuition', tuitionSchema);

async function findTuitionByStudentId(studentId) {
  return await Tuition.find({ student_id: studentId });
}

async function findTuitionById(tuitionFeeId) {
  return await Tuition.findOne({ tuition_fee_id: tuitionFeeId });
}

async function updateTuitionStatus(tuitionFeeId, status) {
  return await Tuition.findOneAndUpdate(
    { tuition_fee_id: tuitionFeeId },
    { status: status },
    { new: true }
  );
}

module.exports = { Tuition, findTuitionByStudentId, findTuitionById, updateTuitionStatus };