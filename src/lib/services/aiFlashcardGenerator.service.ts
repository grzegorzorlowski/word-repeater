// src/lib/services/aiFlashcardGenerator.service.ts

import { createOpenRouterService } from "./openrouter.service";
import type { FlashcardSuggestionDTO } from "../../types";

/**
 * Parameters for generating flashcards using AI.
 */
export interface GenerateFlashcardsWithAIParams {
  text: string;
  limit: number;
}

/**
 * Result of AI flashcard generation.
 */
export interface GenerateFlashcardsWithAIResult {
  success: boolean;
  flashcards?: Omit<FlashcardSuggestionDTO, "id">[];
  error?: string;
}

/**
 * Generates flashcards from text using OpenRouter AI service.
 *
 * This function:
 * 1. Validates the OpenRouter API configuration
 * 2. Constructs a specialized prompt for flashcard generation
 * 3. Calls the OpenRouter API with structured response format
 * 4. Validates and returns the generated flashcards
 *
 * @param params - Text and limit for flashcard generation
 * @returns Result object with generated flashcards or error
 */
export async function generateFlashcardsWithAI(
  params: GenerateFlashcardsWithAIParams
): Promise<GenerateFlashcardsWithAIResult> {
  const { text, limit } = params;

  try {
    // Validate API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "OpenRouter API key is not configured",
      };
    }

    // Create OpenRouter service with flashcard-specific configuration
    const openRouterService = createOpenRouterService({
      apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
      modelName: import.meta.env.OPENROUTER_MODEL_NAME || "openai/gpt-4o-mini",
      apiKey,
      modelParameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
      timeout: 60000, // 60 seconds for longer texts
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "FlashcardsResponse",
          strict: true,
          schema: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["flashcards"],
            additionalProperties: false,
          },
        },
      },
    });

    // Prepare system message for the AI
    const systemMessage = `You are an expert language teacher specializing in creating effective vocabulary flashcards for language learning.

Your task is to analyze the provided text and extract important vocabulary words that are relevant to the text's context and topic.

CRITICAL Translation Rules (MUST FOLLOW):
- If the text is in ENGLISH → translate to POLISH
- If the text is in ANY OTHER LANGUAGE (French, Polish, German, Spanish, Italian, etc.) → translate to ENGLISH
- ALWAYS detect the source language first before translating

REQUIRED Flashcard Format:
Each flashcard MUST contain BOTH a word AND a sentence in BOTH question and answer.

Question (original language):
word [phonetic transcription]

sentence using that word

Answer (translated):
translated word

translated sentence

EXAMPLE for French text (French → English):
Question:
guerre [ɡɛʁ]

La guerre a duré plusieurs années.

Answer:
war

The war lasted several years.

EXAMPLE for English text (English → Polish):
Question:
ceasefire [ˈsiːsˌfaɪər]

The two countries agreed to a ceasefire.

Answer:
zawieszenie broni

Oba kraje zgodziły się na zawieszenie broni.

Guidelines:
- ALWAYS include BOTH word AND sentence in question and answer (this is mandatory)
- Extract vocabulary that is relevant to the text's topic and context
- Focus on words that are meaningful and useful for language learners
- Prioritize topic-specific vocabulary (e.g., for war-related text: "ceasefire", "truce", "offensive")
- Avoid overly simple or common words (like "the", "and", "is")
- Include accurate phonetic transcription using IPA (International Phonetic Alphabet) for the word in the question
- Generate as many flashcards as you can find relevant vocabulary, but no more than ${limit} flashcards
- Each flashcard should focus on a single word and its usage in context
- The sentence should be from the text or a clear contextual example
- If the translation heavily depends on context, add a brief explanation at the end of the answer (only if necessary)`;

    // Prepare user message
    const userMessage = `Please extract vocabulary and generate up to ${limit} language learning flashcards from the following text.

IMPORTANT: Each flashcard MUST include:
- Question: word [IPA transcription] on first line, then a blank line, then a full sentence
- Answer: translated word on first line, then a blank line, then translated sentence

Example structure:
{"question": "guerre [ɡɛʁ]\\n\\nLa guerre a duré plusieurs années.", "answer": "war\\n\\nThe war lasted several years."}

Text to analyze:
${text}`;

    // Call OpenRouter API
    const response = await openRouterService.sendMessage(userMessage, systemMessage);

    // Extract and validate flashcards from response
    const flashcardsData = response.content.flashcards;

    if (!Array.isArray(flashcardsData)) {
      return {
        success: false,
        error: "Invalid response format from AI service",
      };
    }

    // Validate each flashcard
    const flashcards: Omit<FlashcardSuggestionDTO, "id">[] = [];
    for (const fc of flashcardsData) {
      if (
        typeof fc === "object" &&
        fc !== null &&
        typeof (fc as { question?: unknown }).question === "string" &&
        typeof (fc as { answer?: unknown }).answer === "string"
      ) {
        const question = (fc as { question: string }).question.trim();
        const answer = (fc as { answer: string }).answer.trim();

        // Validate that question and answer contain both word and sentence
        // Expected format: "word [phonetic]\n\nsentence" for question
        // Expected format: "word\n\nsentence" for answer
        const questionHasNewline = question.includes("\n");
        const answerHasNewline = answer.includes("\n");

        // Additional check: question should have reasonable length (word + transcription + sentence)
        const questionMinLength = 20; // At minimum: word + [IPA] + short sentence
        const answerMinLength = 10; // At minimum: word + short sentence

        if (
          question.length >= questionMinLength &&
          answer.length >= answerMinLength &&
          questionHasNewline &&
          answerHasNewline
        ) {
          flashcards.push({ question, answer });
        } else {
          // Log rejected flashcard for debugging
          // eslint-disable-next-line no-console
          console.warn("Rejected flashcard - missing sentence format:", {
            questionLength: question.length,
            answerLength: answer.length,
            questionHasNewline,
            answerHasNewline,
            questionPreview: question.substring(0, 50),
          });
        }
      }
    }

    if (flashcards.length === 0) {
      return {
        success: false,
        error: "AI service generated no valid flashcards",
      };
    }

    return {
      success: true,
      flashcards,
    };
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Error generating flashcards with AI:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate flashcards with AI",
    };
  }
}
