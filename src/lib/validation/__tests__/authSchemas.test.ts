import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  loginSchema,
  registerSchema,
  registerBackendSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
} from "../authSchemas";

describe("authSchemas", () => {
  describe("emailSchema", () => {
    describe("valid emails", () => {
      it("should accept valid email format", () => {
        const result = emailSchema.safeParse("user@example.com");
        expect(result.success).toBe(true);
      });

      it("should accept email with subdomain", () => {
        const result = emailSchema.safeParse("user@mail.example.com");
        expect(result.success).toBe(true);
      });

      it("should accept email with plus sign", () => {
        const result = emailSchema.safeParse("user+tag@example.com");
        expect(result.success).toBe(true);
      });

      it("should accept email with dots in local part", () => {
        const result = emailSchema.safeParse("first.last@example.com");
        expect(result.success).toBe(true);
      });

      it("should accept email with numbers", () => {
        const result = emailSchema.safeParse("user123@example456.com");
        expect(result.success).toBe(true);
      });
    });

    describe("invalid emails", () => {
      it("should reject empty string", () => {
        const result = emailSchema.safeParse("");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Email is required");
        }
      });

      it("should reject email without @", () => {
        const result = emailSchema.safeParse("userexample.com");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please enter a valid email address");
        }
      });

      it("should reject email without domain", () => {
        const result = emailSchema.safeParse("user@");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please enter a valid email address");
        }
      });

      it("should reject email without local part", () => {
        const result = emailSchema.safeParse("@example.com");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please enter a valid email address");
        }
      });

      it("should reject email with spaces", () => {
        const result = emailSchema.safeParse("user @example.com");
        expect(result.success).toBe(false);
      });

      it("should reject email exceeding 255 characters", () => {
        const longEmail = `${"a".repeat(250)}@example.com`;
        const result = emailSchema.safeParse(longEmail);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Email must be less than 255 characters");
        }
      });
    });
  });

  describe("passwordSchema", () => {
    describe("valid passwords", () => {
      it("should accept password meeting all requirements", () => {
        const result = passwordSchema.safeParse("SecurePass123!");
        expect(result.success).toBe(true);
      });

      it("should accept password with multiple special characters", () => {
        const result = passwordSchema.safeParse("P@ssw0rd!#$");
        expect(result.success).toBe(true);
      });

      it("should accept long password", () => {
        const result = passwordSchema.safeParse("ThisIsAVeryLongSecurePassword123!");
        expect(result.success).toBe(true);
      });
    });

    describe("invalid passwords", () => {
      it("should reject password less than 8 characters", () => {
        const result = passwordSchema.safeParse("Pass1!");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
        }
      });

      it("should reject password exceeding 128 characters", () => {
        const longPassword = "A1!" + "a".repeat(126);
        const result = passwordSchema.safeParse(longPassword);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Password must be less than 128 characters");
        }
      });

      it("should reject password without uppercase letter", () => {
        const result = passwordSchema.safeParse("password123!");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((issue) => issue.message.includes("uppercase"))).toBe(true);
        }
      });

      it("should reject password without lowercase letter", () => {
        const result = passwordSchema.safeParse("PASSWORD123!");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((issue) => issue.message.includes("lowercase"))).toBe(true);
        }
      });

      it("should reject password without number", () => {
        const result = passwordSchema.safeParse("Password!");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((issue) => issue.message.includes("number"))).toBe(true);
        }
      });

      it("should reject password without special character", () => {
        const result = passwordSchema.safeParse("Password123");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((issue) => issue.message.includes("special character"))).toBe(true);
        }
      });

      it("should return multiple error messages for multiple violations", () => {
        const result = passwordSchema.safeParse("pass");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe("simplePasswordSchema", () => {
    it("should accept any non-empty password", () => {
      const result = simplePasswordSchema.safeParse("anypassword");
      expect(result.success).toBe(true);
    });

    it("should accept password with only letters", () => {
      const result = simplePasswordSchema.safeParse("password");
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = simplePasswordSchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "anypassword",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });

    it("should return errors for both fields when both invalid", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.email).toBeDefined();
        expect(errors.password).toBeDefined();
      }
    });
  });

  describe("registerSchema", () => {
    const validRegistration = {
      email: "user@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      acceptTerms: true as const,
    };

    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it("should reject when passwords do not match", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === "Passwords do not match")).toBe(true);
      }
    });

    it("should reject when terms not accepted", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.message.includes("accept the terms and conditions"))
        ).toBe(true);
      }
    });

    it("should reject weak password", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });
  });

  describe("registerBackendSchema", () => {
    it("should accept valid backend registration data", () => {
      const result = registerBackendSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass123!",
        acceptTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it("should not require confirmPassword", () => {
      const result = registerBackendSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass123!",
        acceptTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it("should enforce password requirements", () => {
      const result = registerBackendSchema.safeParse({
        email: "user@example.com",
        password: "weak",
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    const validReset = {
      token: "valid-token-123",
      password: "NewSecure123!",
      confirmPassword: "NewSecure123!",
    };

    it("should accept valid reset data", () => {
      const result = resetPasswordSchema.safeParse(validReset);
      expect(result.success).toBe(true);
    });

    it("should reject when passwords do not match", () => {
      const result = resetPasswordSchema.safeParse({
        ...validReset,
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === "Passwords do not match")).toBe(true);
      }
    });

    it("should reject empty token", () => {
      const result = resetPasswordSchema.safeParse({
        ...validReset,
        token: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.token).toBeDefined();
      }
    });

    it("should reject weak password", () => {
      const result = resetPasswordSchema.safeParse({
        ...validReset,
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteAccountSchema", () => {
    it("should accept exact confirmation text", () => {
      const result = deleteAccountSchema.safeParse({
        confirmationText: "DELETE",
      });
      expect(result.success).toBe(true);
    });

    it("should reject lowercase confirmation", () => {
      const result = deleteAccountSchema.safeParse({
        confirmationText: "delete",
      });
      expect(result.success).toBe(false);
    });

    it("should reject incorrect confirmation text", () => {
      const result = deleteAccountSchema.safeParse({
        confirmationText: "REMOVE",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please type DELETE to confirm account deletion");
      }
    });

    it("should reject empty confirmation", () => {
      const result = deleteAccountSchema.safeParse({
        confirmationText: "",
      });
      expect(result.success).toBe(false);
    });
  });
});





