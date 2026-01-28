// src/lib/services/srsService.ts
import { fsrs, generatorParameters, createEmptyCard, type Card, Rating } from "ts-fsrs";
import type { FlashcardScheduleDTO, Rating as AppRating } from "../../types";

/**
 * Global FSRS parameters for the application.
 * These are hardcoded for MVP as per planning decisions.
 */
const FSRS_PARAMS = generatorParameters({
  request_retention: 0.9, // Target probability of memory recall (0.8-0.9 recommended)
  maximum_interval: 36500, // Maximum days between reviews
  enable_fuzz: true, // Add random delay to prevent cards reviewing on same day
  enable_short_term: false, // Disable short-term scheduling for MVP
});

/**
 * FSRS scheduler instance with global parameters.
 */
const scheduler = fsrs(FSRS_PARAMS);

/**
 * Converts our database schedule format to ts-fsrs Card format.
 *
 * @param schedule - The flashcard schedule from database
 * @param now - Current date/time for calculating elapsed days
 * @returns ts-fsrs Card object
 */
function scheduleToCard(schedule: FlashcardScheduleDTO, now: Date): Card {
  const dueDate = new Date(schedule.next_due);
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Create a card with the current schedule state
  // For new cards (repetition_count = 0), we use createEmptyCard logic
  // For existing cards, we reconstruct the card state from our stored values
  const card: Card = {
    due: dueDate,
    stability: schedule.interval_days, // Use interval_days as stability approximation
    difficulty: schedule.ease_factor, // Use ease_factor as difficulty
    elapsed_days: elapsedDays,
    scheduled_days: schedule.interval_days,
    reps: schedule.repetition_count,
    lapses: 0, // We don't track lapses separately in our schema
    state: schedule.repetition_count === 0 ? 0 : 2, // 0 = New, 2 = Review
    last_review: dueDate, // Approximate last review from next_due
    learning_steps: 0, // Learning steps counter (0 for MVP since short-term scheduling is disabled)
  };

  return card;
}

/**
 * Converts ts-fsrs Card format back to our database schedule format.
 *
 * @param card - The updated card from ts-fsrs
 * @param now - Current date/time for calculating next_due
 * @returns Database schedule format
 */
function cardToSchedule(card: Card, now: Date): FlashcardScheduleDTO {
  // Calculate next_due by adding scheduled_days to current time
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + card.scheduled_days);

  return {
    next_due: nextDue.toISOString(),
    interval_days: card.scheduled_days,
    repetition_count: card.reps,
    ease_factor: card.difficulty,
  };
}

/**
 * Processes a review rating and returns the updated schedule.
 *
 * This function:
 * 1. Converts the current schedule to a ts-fsrs Card
 * 2. Processes the review with the given rating
 * 3. Converts the updated card back to our database format
 *
 * @param currentSchedule - The current flashcard schedule from database
 * @param rating - The review rating ("again" | "hard" | "good" | "easy")
 * @param now - Current date/time (defaults to now)
 * @returns Updated schedule in database format
 */
export function processReview(
  currentSchedule: FlashcardScheduleDTO,
  rating: AppRating,
  now: Date = new Date()
): FlashcardScheduleDTO {
  // Convert rating from our enum to ts-fsrs Rating enum
  const fsrsRating = ratingToFSRS(rating);

  // Convert current schedule to ts-fsrs Card
  const card = scheduleToCard(currentSchedule, now);

  // Process the review - repeat() returns IPreview object with keys "1", "2", "3", "4"
  // corresponding to Rating.Again (1), Rating.Hard (2), Rating.Good (3), Rating.Easy (4)
  const schedulingCards = scheduler.repeat(card, now);

  // Access the card for the selected rating using numeric key as string
  // Rating enum values: Again=1, Hard=2, Good=3, Easy=4
  // IPreview has properties "1", "2", "3", "4" that are RecordLogItem objects
  const ratingKey = String(fsrsRating) as "1" | "2" | "3" | "4";
  const selectedCardItem = schedulingCards[ratingKey];

  if (!selectedCardItem || typeof selectedCardItem === "function") {
    // Fallback: if rating not found, use "good" (3) as default
    const goodCardItem = schedulingCards["3"];
    if (!goodCardItem || typeof goodCardItem === "function") {
      throw new Error("Failed to process review: no scheduling card found");
    }
    return cardToSchedule(goodCardItem.card, now);
  }

  // Convert updated card back to our database format
  return cardToSchedule(selectedCardItem.card, now);
}

/**
 * Converts our application Rating enum to ts-fsrs Rating enum.
 *
 * @param rating - Application rating ("again" | "hard" | "good" | "easy")
 * @returns ts-fsrs Rating enum value
 */
function ratingToFSRS(rating: AppRating): Rating {
  switch (rating) {
    case "again":
      return Rating.Again;
    case "hard":
      return Rating.Hard;
    case "good":
      return Rating.Good;
    case "easy":
      return Rating.Easy;
    default:
      return Rating.Good; // Default fallback
  }
}

/**
 * Initializes a new schedule for a flashcard (first time it's added to learning).
 *
 * @param now - Current date/time (defaults to now)
 * @returns Initial schedule in database format
 */
export function initializeSchedule(now: Date = new Date()): FlashcardScheduleDTO {
  // Create an empty card (new card)
  const emptyCard = createEmptyCard(now);

  // Convert to our database format
  return cardToSchedule(emptyCard, now);
}
