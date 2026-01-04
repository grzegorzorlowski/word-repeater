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
        temperature: 0.5, // Lower temperature for faster, more focused responses
        max_tokens: 6000, // Optimized for ~20 flashcards (300 tokens each max)
      },
      timeout: 25000, // 25 seconds to match frontend expectations
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

    // Prepare system message for the AI (optimized for speed and accuracy)
    const systemMessage = `You are a language learning expert. Extract up to ${limit} vocabulary words from the text and create flashcards.

TRANSLATION RULES:
- English → Polish
- Any other language → English

CRITICAL FORMAT (use \\n\\n as separator):
Question: "word [IPA]\\n\\nsentence with the word"
Answer: "translation\\n\\ntranslated sentence"

EXAMPLE JSON (French→English):
{"question": "guerre [ɡɛʁ]\\n\\nLa guerre a duré plusieurs années.", "answer": "war\\n\\nThe war lasted several years."}

GUIDELINES:
- MUST include \\n\\n separator between word and sentence
- Include both word+sentence in question AND answer
- Focus on topic-specific vocabulary, skip common words
- Use accurate IPA transcription`;

    // Prepare user message (optimized for speed)
    const userMessage = `Extract ${limit} vocabulary flashcards from this text:

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
