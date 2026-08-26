import { intentRouter } from "./ai/intentRouter";

export const aiService = {
  async chatWithMascot({ message, context = {} }) {
    return await intentRouter.route({ message, context });
  },
};
