import mongoose from 'mongoose';
const { Schema } = mongoose;

const taskSchema = new Schema({
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  start_date: { type: Date, default: Date.now },   // task creation date
  due_date: { type: Date, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'missing', 'completed'], default: 'todo' },
  created_at: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  stress_factors: { type: Object, default: {} },
  tags: [{ type: String }],
  subtasks: [
    {
      title: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ]
});

// Optional: format dates before sending to frontend
taskSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.start_date = obj.start_date ? obj.start_date.toISOString().split("T")[0] : null;
  obj.due_date = obj.due_date ? obj.due_date.toISOString().split("T")[0] : null;
  return obj;
};

export default mongoose.model('Task', taskSchema);
