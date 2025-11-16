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
    const systemMessage = `You are an expert educational content creator specializing in creating effective flashcards for learning.

Your task is to analyze the provided text and generate high-quality question-answer pairs that help learners understand and remember the key concepts.

Guidelines:
- Focus on the most important concepts, definitions, facts, and relationships in the text
- Create clear, concise questions that test understanding
- Provide accurate, complete answers
- Avoid overly simple or trivial questions
- Ensure questions are self-contained and understandable without additional context
- Generate exactly ${limit} flashcards
- Each flashcard should focus on a single concept or fact`;

    // Prepare user message
    const userMessage = `Please generate ${limit} flashcards from the following text:

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

        // Validate that question and answer are not empty
        if (question.length > 0 && answer.length > 0) {
          flashcards.push({ question, answer });
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
