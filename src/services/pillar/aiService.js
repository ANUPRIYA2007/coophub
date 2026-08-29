import { intentRouter } from "./ai/intentRouter.js";

export const aiService = {
  async chatWithMascot({ message, context = {} }) {
    return await intentRouter.route({ message, context });
  },
};
