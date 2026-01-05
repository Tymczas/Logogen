
import { GoogleGenAI } from "@google/genai";
import { ImageSize, AspectRatio } from "../types";

export const generateLogo = async (
  prompt: string,
  size: ImageSize = '1K'
): Promise<{ url: string; base64: string; mimeType: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `A clean, professional, high-resolution logo design for: ${prompt}. Minimalist, vector style, suitable for educational non-profits. White background.` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64 = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return {
        url: `data:${mimeType};base64,${base64}`,
        base64,
        mimeType
      };
    }
  }

  throw new Error("No image data returned from model.");
};

export const animateLogo = async (
  image: { base64: string; mimeType: string },
  animationPrompt: string,
  aspectRatio: AspectRatio = '16:9'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: animationPrompt,
    image: {
      imageBytes: image.base64,
      mimeType: image.mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  // Poll for completion using the recommended 10s interval for Veo models.
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Failed to get video download link.");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
