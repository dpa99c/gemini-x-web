import type { GenerativeModel, SafetySetting, StartChatParams , GenerativeContentBlob, InlineDataPart, InputContent, Part, ChatSession, Content } from '@google/generative-ai';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**************************************************************************
 * Type definitions
 **************************************************************************/

/**
 * Model parameters to be passed to `initModel` function.
 */
export interface ModelParams {
  /**
   * The name of the model to be used.
   */
  modelName:string;
  /**
   * The API key to be used.
   */
  apiKey:string;
  /**
   * The temperature to be used for generation.
   */
  temperature?:number;
  /**
   * The topK to be used for generation.
   */
  topK?:number;
  /**
   * The topP to be used for generation.
   */
  topP?:number;
  /**
   * The maximum number of tokens to be generated.
   */
  maxOutputTokens?:number;
  /**
   * The stop sequences to be used for generation.
   */
  stopSequences?:string[];
  /**
   * The safety settings to be used for generation.
   */
  safetySettings?:SafetySettings;
}

/**
 * Safety settings to be passed to `initModel` function.
 */
export interface SafetySettings {
  [SafetySettingHarmCategory.HARASSMENT]?:SafetySettingLevel;
  [SafetySettingHarmCategory.HATE_SPEECH]?:SafetySettingLevel;
  [SafetySettingHarmCategory.SEXUALLY_EXPLICIT]?:SafetySettingLevel;
  [SafetySettingHarmCategory.DANGEROUS_CONTENT]?:SafetySettingLevel;
  [SafetySettingHarmCategory.UNSPECIFIED]?:SafetySettingLevel;
}

/**
 * Safety setting level to be passed to `initModel` function.
 */
export enum SafetySettingLevel{
  NONE = "NONE",
  ONLY_HIGH = "ONLY_HIGH",
  MEDIUM_AND_ABOVE = "MEDIUM_AND_ABOVE",
  LOW_AND_ABOVE = "LOW_AND_ABOVE",
  UNSPECIFIED = "UNSPECIFIED"
}

/**
 * Harm category to be passed to `initModel` function.
 */
export enum SafetySettingHarmCategory{
  HARASSMENT = "HARASSMENT",
  HATE_SPEECH = "HATE_SPEECH",
  SEXUALLY_EXPLICIT = "SEXUALLY_EXPLICIT",
  DANGEROUS_CONTENT = "DANGEROUS_CONTENT",
  UNSPECIFIED = "UNSPECIFIED"
}

/**
 * A chat history item to be passed to `initChat` function.
 */
export interface ChatHistoryItem {
  /**
   * Whether the message is from the user or the model.
   */
  isUser:boolean;
  /**
   * The text of the message.
   */
  text?:string;
  /**
   * List of images to be given to the model.
   */
  images?:GenerativeContentBlob[]
}

/**
 * A chat history content part to be passed to `initChat` function.
 */
export interface ModelChatHistoryPart{
  /**
   * The type of the part.
   */
  type:string;
  /**
   * The content of the part.
   */
  content:string;
}

/**
 * A chat history item to be passed to `initChat` function.
 */
export interface ModelChatHistoryItem {
  /**
   * Whether the message is from the user or the model.
   */
  isUser:boolean;
  /**
   * The parts of the message.
   */
  parts:ModelChatHistoryPart[];
}

/**
 * Options to be passed to `sendMessage` and `sendChatMessage` functions.
 */
export interface SendMessageOptions {
  /**
   * List of images to be given to the model.
   */
  images?:GenerativeContentBlob[],
  onResponseChunk?: (responseTextChunk:string) => void
}

/**
 * Options to be passed to `countTokens` function.
 */
export interface CountTokensOptions {
  images?:GenerativeContentBlob[]
}

/**
 * Options to be passed to `countChatTokens` function.
 */
export interface CountChatTokensOptions {
  inputText?:string,
  images?:GenerativeContentBlob[]
}

export class GeminiX  {
  private static generativeAI: GoogleGenerativeAI | undefined;
  private static model:GenerativeModel | undefined;
  private static chat:ChatSession | undefined;

  /**************************************************************************
   * Plugin Methods
   **************************************************************************/

  static async initModel( params:ModelParams ): Promise<void> {
    this.generativeAI = new GoogleGenerativeAI(params.apiKey);

    const safetySettings:SafetySetting[] = [];
    if(params.safetySettings){
      for(const harmCategory in params.safetySettings){
        const modelHarmCategory = this.mapHarmCategory(harmCategory as any),
          harmBlockThreshold = (params.safetySettings as any)[harmCategory] as SafetySettingLevel,
          modelSafetySettingLevel = this.mapSafetySettingLevel(harmBlockThreshold);
        safetySettings.push({
          category: modelHarmCategory,
          threshold: modelSafetySettingLevel
        })
      }
    }

    this.model = this.generativeAI.getGenerativeModel({
      model: params.modelName,
      safetySettings: safetySettings,
      generationConfig: {
        temperature: params.temperature,
        topK: params.topK,
        topP: params.topP,
        maxOutputTokens: params.maxOutputTokens,
        stopSequences: params.stopSequences,
      }
    });
  }

  static async sendMessage(inputText:string, options?: SendMessageOptions): Promise<string> {
    if(!this.model){
      throw new Error("Model not initialized");
    }

    let streamResponse = false;
    const imageParts:InlineDataPart[] = [];
    if(options){
      if(options?.onResponseChunk){
        streamResponse = true;
      }
      const images = options.images || [];
      for(const image of images){
        imageParts.push({inlineData: image});
      }
    }

    let responseText;
    if(streamResponse){
      const result = await this.model.generateContentStream([inputText, ...imageParts]);
      responseText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        options?.onResponseChunk?.(chunkText);
        responseText += chunkText;
      }
    }else{
      const result = await this.model.generateContent([inputText, ...imageParts]);const response = await result.response;
      responseText = response.text();
    }

    return responseText;
  }

  static async countTokens(inputText:string, options?: CountTokensOptions): Promise<number> {
    if(!this.model){
      throw new Error("Model not initialized");
    }

    const imageParts:InlineDataPart[] = [];
    if(options){
      const images = options.images || [];
      for(const image of images){
        imageParts.push({inlineData: image});
      }
    }
    const {totalTokens} = await this.model.countTokens([inputText, ...imageParts]);
    return totalTokens;
  }

  static  async initChat(chatHistory?:ChatHistoryItem[]): Promise<void> {
    if(!this.model){
      throw new Error("Model not initialized");
    }

    const modelChatHistory:InputContent[] = [];
    if(chatHistory){
      for(const chatHistoryItem of chatHistory){
        const parts:Part[] = []
        if(chatHistoryItem.text){
          parts.push({
            text: chatHistoryItem.text
          });
        }
        if(chatHistoryItem.images){
          for(const image of chatHistoryItem.images){
            parts.push({inlineData: image});
          }
        }
        const modelChatHistoryItem:InputContent = {
          role: chatHistoryItem.isUser ? "user" : "model",
          parts
        };
        modelChatHistory.push(modelChatHistoryItem);
      }
    }

    const startChatParams:StartChatParams = {history: modelChatHistory};
    this.chat = await this.model.startChat(startChatParams);
  }

  static async sendChatMessage(inputText:string, options?: SendMessageOptions): Promise<string> {
    if(!this.model){
      throw new Error("Model not initialized");
    }
    if(!this.chat){
      throw new Error("Chat not initialized");
    }

    let streamResponse = false;
    const imageParts:InlineDataPart[] = [];
    if(options){
      if(options?.onResponseChunk){
        streamResponse = true;
      }
      const images = options.images || [];
      for(const image of images){
        imageParts.push({inlineData: image});
      }
    }

    let responseText;
    if(streamResponse){
      const result = await this.chat.sendMessageStream([inputText, ...imageParts]);
      responseText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        options?.onResponseChunk?.(chunkText);
        responseText += chunkText;
      }
    }else{
      const result = await this.chat.sendMessage([inputText, ...imageParts]);const response = await result.response;
      responseText = response.text();
    }

    return responseText;
  }

  static async countChatTokens(options?: CountChatTokensOptions): Promise<number> {
    if(!this.model){
      throw new Error("Model not initialized");
    }
    if(!this.chat){
      throw new Error("Chat not initialized");
    }

    const history = await this.chat.getHistory();
    const parts:Part[] = []
    if(options?.inputText){
      parts.push({
        text: options.inputText
      });
    }
    if(options?.images){
      for(const image of options.images){
        parts.push({inlineData: image});
      }
    }

    const userHistory:Content[] = [];
    if(parts.length > 0){
      userHistory.push({
        role: "user",
        parts
      });
    }
    const contents = [...history, ...userHistory];
    const {totalTokens} = await this.model.countTokens({contents});
    return totalTokens;
  }

  static async getChatHistory(): Promise<ModelChatHistoryItem[]> {
    if(!this.model){
      throw new Error("Model not initialized");
    }
    if(!this.chat){
      throw new Error("Chat not initialized");
    }

    const history = await this.chat.getHistory();
    const chatHistory:ModelChatHistoryItem[] = [];
    for(const content of history){
      const chatHistoryItem:ModelChatHistoryItem = {
        isUser: content.role === "user",
        parts: []
      };
      for(const part of content.parts){
        const modelChatHistoryPart:ModelChatHistoryPart = {
          type: part.inlineData ? (part.inlineData.mimeType || "image") : "text",
          content: part.text || part.inlineData?.data || ""
        };
        chatHistoryItem.parts.push(modelChatHistoryPart);
      }
      chatHistory.push(chatHistoryItem);
    }

    return chatHistory
  }

  /**************************************************************************
   * Internal Methods
   **************************************************************************/
  private static mapHarmCategory(harmCategory:SafetySettingHarmCategory): HarmCategory{
    switch (harmCategory) {
      case SafetySettingHarmCategory.HARASSMENT:
        return HarmCategory.HARM_CATEGORY_HARASSMENT;
      case SafetySettingHarmCategory.HATE_SPEECH:
        return HarmCategory.HARM_CATEGORY_HATE_SPEECH;
      case SafetySettingHarmCategory.SEXUALLY_EXPLICIT:
        return HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT;
      case SafetySettingHarmCategory.DANGEROUS_CONTENT:
        return HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT;
      case SafetySettingHarmCategory.UNSPECIFIED:
        return HarmCategory.HARM_CATEGORY_UNSPECIFIED;
      default:
        return HarmCategory.HARM_CATEGORY_UNSPECIFIED;
    }
  }

  private static mapSafetySettingLevel(safetySettingLevel:SafetySettingLevel): HarmBlockThreshold{
    switch (safetySettingLevel) {
      case SafetySettingLevel.NONE:
        return HarmBlockThreshold.BLOCK_NONE;
      case SafetySettingLevel.ONLY_HIGH:
        return HarmBlockThreshold.BLOCK_ONLY_HIGH;
      case SafetySettingLevel.MEDIUM_AND_ABOVE:
        return HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
      case SafetySettingLevel.LOW_AND_ABOVE:
        return HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
      case SafetySettingLevel.UNSPECIFIED:
        return HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED;
      default:
        return HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED;
    }
  }
}
