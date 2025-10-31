import { Schema, model } from 'mongoose';

const ChatLogSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  response: {
    type: Object,
    required: true,
    validate: {
      validator: function (v) {
        return v && typeof v.response === 'string' &&
          typeof v.stress_band === 'number' &&
          typeof v.tone === 'string' &&
          Array.isArray(v.steps) &&
          Array.isArray(v.buttons);
      },
      message: props => 'Response must contain {response (string), stress_band (number), tone (string), steps (array), buttons (array)}'
    }
  },
  stress_band: { type: Number, required: true, min: 1, max: 5 },
  escalation_required: { type: Boolean, default: false },
});

export const ChatLog = model('ChatLog', ChatLogSchema);