import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'anonymous',
    },
    question: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      default: 'general_query',
    },
    machineId: {
      type: String,
      default: null,
    },
    answer: {
      type: String,
      required: true,
    },
    sources: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: 'openai/gpt-oss-20b',
    },
  },
  {
    timestamps: true,
  }
);

const ChatLog = mongoose.model('ChatLog', chatLogSchema);
export default ChatLog;
