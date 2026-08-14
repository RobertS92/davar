/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Grok API. You may update this service, but you should not need to.
The Grok API can be communicated with the "openai" package, so you can use the same functions as the openai package. It may not support all the same features, so please be careful.


grok-3-latest
grok-3-fast-latest
grok-3-mini-latest
*/
import OpenAI from "openai";
import { getGrokApiKey } from "./config";

export const getGrokClient = () => {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    throw new Error(
      "Grok is not configured. Add a valid EXPO_PUBLIC_VIBECODE_GROK_API_KEY to enable it."
    );
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.x.ai/v1",
  });
};
