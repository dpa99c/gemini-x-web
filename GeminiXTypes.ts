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
 * Interface for sending an image.
 * @public
 */
export declare interface GenerativeContentBlob {
  mimeType: string;
  /**
   * Image as a base64 string.
   */
  data: string;
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

/**
 * Model response data passed to back to `sendMessage` and `sendChatMessage` functions.
 * Also passed to event handlers registered on the `window` object for the `GeminiXResponseChunkEvent`.
 */
export interface GeminiXResponseChunk {
  response:string,
  isChat:boolean
}

/**
 * Model response data passed to back to `countTokens` and `countChatTokens` functions.
 */
export interface GeminiXResponseCount {
  count:number,
  isChat:boolean
}

/**
 * An image to be given to the model specified by a URI.
 * The mimeType is optional and will attempt to be inferred from the URI if not specified.
 */
export interface GeminiXImage {
  uri:string,
  mimeType?:string,
}

export interface PluginSendMessageOptions {
  /**
   * List of image URIs to be given to the model.
   */
  images?:GeminiXImage[],
  /**
   * Whether to stream the response from the model before the final response is received.
   * If `true`, then event listeners registered on the `window` object for the `GeminiXResponseChunkEvent` will be called with partial responses until the final response is received.
   * The final response will be the full model response text.
   * Default is `false`.
   */
  streamResponse?: boolean
}


export interface PluginCountTokensOptions {
  /**
   * List of image images to be given to the model.
   */
  images?:GeminiXImage[]
}

export interface PluginCountChatTokensOptions {
  /**
   * User input text to be given to the model.
   */
  inputText?:string,
  /**
   * List of images to be given to the model.
   */
  images?:GeminiXImage[]
}

export interface PluginChatHistoryItem {
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
  images?:GeminiXImage[]
}
