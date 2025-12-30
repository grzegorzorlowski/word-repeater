// src/lib/services/auditLogService.ts
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Interface for audit log entry parameters
 */
interface AuditLogEntry {
  userId: string | null;
  action: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an action to the audit_logs table in the database.
 *
 * This function is used to track important operations, errors, and user actions
 * for debugging, security, and compliance purposes.
 *
 * @param supabase - Supabase client instance
 * @param entry - Audit log entry details
 * @returns Promise that resolves when the log is written
 */
export async function logAuditEntry(supabase: SupabaseClient, entry: AuditLogEntry): Promise<void> {
  try {
    const { action, userId, details } = entry;

    // Construct the action string with details if provided
    const actionString = details ? `${action}: ${JSON.stringify(details)}` : action;

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action: actionString,
    });

    if (error) {
      // If audit logging fails, log to console but don't throw
      // We don't want audit log failures to break the main application flow
      // eslint-disable-next-line no-console
      console.error("Failed to write audit log:", error);
    }
  } catch (error) {
    // Catch any unexpected errors in audit logging
    // eslint-disable-next-line no-console
    console.error("Unexpected error in audit logging:", error);
  }
}

/**
 * Logs a successful flashcard generation operation
 */
export async function logFlashcardGeneration(
  supabase: SupabaseClient,
  userId: string,
  flashcardCount: number,
  textLength: number
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_generation_success",
    details: {
      flashcard_count: flashcardCount,
      text_length: textLength,
    },
  });
}

/**
 * Logs a failed flashcard generation operation
 */
export async function logFlashcardGenerationFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string,
  textLength?: number
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_generation_failure",
    details: {
      error,
      text_length: textLength,
    },
  });
}

/**
 * Logs a validation error
 */
export async function logValidationError(
  supabase: SupabaseClient,
  errors: { field: string; message: string }[]
): Promise<void> {
  await logAuditEntry(supabase, {
    userId: null,
    action: "validation_error",
    details: {
      errors,
    },
  });
}

/**
 * Logs a failed flashcard list retrieval operation
 */
export async function logFlashcardListFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string,
  queryParams?: Record<string, unknown>
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_list_failure",
    details: {
      error,
      query_params: queryParams,
    },
  });
}

/**
 * Logs a failed manual flashcard creation operation
 */
export async function logFlashcardCreationFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_creation_failure",
    details: {
      error,
    },
  });
}

/**
 * Logs a failed flashcard update operation
 */
export async function logFlashcardUpdateFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string,
  flashcardId?: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_update_failure",
    details: {
      error,
      flashcard_id: flashcardId,
    },
  });
}

/**
 * Logs a successful flashcard deletion
 */
export async function logFlashcardDeletion(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_deleted",
    details: {
      flashcard_id: flashcardId,
    },
  });
}

/**
 * Logs a failed flashcard delete operation
 */
export async function logFlashcardDeleteFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string,
  flashcardId?: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_delete_failure",
    details: {
      error,
      flashcard_id: flashcardId,
    },
  });
}

/**
 * Logs a successful flashcard acceptance (AI-generated flashcard accepted)
 */
export async function logFlashcardAcceptance(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_accepted",
    details: {
      flashcard_id: flashcardId,
    },
  });
}

/**
 * Logs a successful flashcard rejection (AI-generated flashcard rejected)
 */
export async function logFlashcardRejection(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_rejected",
    details: {
      flashcard_id: flashcardId,
    },
  });
}

/**
 * Logs a failed flashcard decision operation (accept/reject)
 */
export async function logFlashcardDecisionFailure(
  supabase: SupabaseClient,
  userId: string | null,
  error: string,
  flashcardId?: string,
  decision?: string
): Promise<void> {
  await logAuditEntry(supabase, {
    userId,
    action: "flashcard_decision_failure",
    details: {
      error,
      flashcard_id: flashcardId,
      decision,
    },
  });
}
