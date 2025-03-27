import * as functions from "firebase-functions";
import { z } from "zod";

/**
 * Error types for the application
 */
export enum ErrorType {
  VALIDATION = "validation_error",
  AUTHENTICATION = "authentication_error",
  AUTHORIZATION = "authorization_error",
  NOT_FOUND = "not_found",
  ALREADY_EXISTS = "already_exists",
  INTERNAL = "internal_error",
}

/**
 * Custom error class for the application
 */
export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Converts an error to an HttpsError
 * @param error The error to convert
 * @returns An HttpsError
 */
export function toHttpsError(error: unknown): functions.https.HttpsError {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return new functions.https.HttpsError("invalid-argument", error.message, error.details);
      case ErrorType.AUTHENTICATION:
        return new functions.https.HttpsError("unauthenticated", error.message, error.details);
      case ErrorType.AUTHORIZATION:
        return new functions.https.HttpsError("permission-denied", error.message, error.details);
      case ErrorType.NOT_FOUND:
        return new functions.https.HttpsError("not-found", error.message, error.details);
      case ErrorType.ALREADY_EXISTS:
        return new functions.https.HttpsError("already-exists", error.message, error.details);
      case ErrorType.INTERNAL:
        return new functions.https.HttpsError("internal", error.message, error.details);
    }
  }
  
  if (error instanceof z.ZodError) {
    return new functions.https.HttpsError(
      "invalid-argument",
      "Validation error",
      error.errors
    );
  }
  
  if (error instanceof Error) {
    return new functions.https.HttpsError("internal", error.message);
  }
  
  return new functions.https.HttpsError("internal", "An unknown error occurred");
}

/**
 * Wraps a function with error handling
 * @param fn The function to wrap
 * @returns A function that handles errors
 */
export function withErrorHandling<T, A extends any[]>(
  fn: (...args: A) => Promise<T>
): (...args: A) => Promise<T> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw toHttpsError(error);
    }
  };
}

/**
 * Creates a validation error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(ErrorType.VALIDATION, message, details);
}

/**
 * Creates an authentication error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createAuthenticationError(message: string, details?: any): AppError {
  return new AppError(ErrorType.AUTHENTICATION, message, details);
}

/**
 * Creates an authorization error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createAuthorizationError(message: string, details?: any): AppError {
  return new AppError(ErrorType.AUTHORIZATION, message, details);
}

/**
 * Creates a not found error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createNotFoundError(message: string, details?: any): AppError {
  return new AppError(ErrorType.NOT_FOUND, message, details);
}

/**
 * Creates an already exists error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createAlreadyExistsError(message: string, details?: any): AppError {
  return new AppError(ErrorType.ALREADY_EXISTS, message, details);
}

/**
 * Creates an internal error
 * @param message The error message
 * @param details The error details
 * @returns An AppError
 */
export function createInternalError(message: string, details?: any): AppError {
  return new AppError(ErrorType.INTERNAL, message, details);
}