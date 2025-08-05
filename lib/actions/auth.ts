/**
 * Authentication-related server actions
 * Example usage of the new Web Crypto password hashing
 */

import { hashPassword, verifyPassword } from "@/lib/crypto-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  kitchenId: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * Server action for user signup
 * Demonstrates how to use the new password hashing
 */
export async function signupUser(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      kitchenId: (formData.get("kitchenId") as string) || undefined,
    };

    // Validate input data
    const validatedData = SignupSchema.parse(rawData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash the password using Web Crypto API
    const hashedPassword = await hashPassword(validatedData.password);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        kitchenId: validatedData.kitchenId,
        role: "STAFF", // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return {
      success: true,
      user,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Signup error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    return {
      success: false,
      error: "Failed to create user account",
    };
  }
}

/**
 * Server action for changing user password
 * Demonstrates password verification and hashing
 */
export async function changePassword(userId: string, formData: FormData) {
  try {
    const rawData = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
    };

    // Validate input data
    const validatedData = ChangePasswordSchema.parse(rawData);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password
    const newHashedPassword = await hashPassword(validatedData.newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Change password error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    return {
      success: false,
      error: "Failed to change password",
    };
  }
}

/**
 * Server action for admin to reset user password
 * Generates a new password and returns it (for admin use)
 */
export async function resetUserPassword(userId: string) {
  try {
    // Generate a random password
    const newPassword = crypto
      .getRandomValues(new Uint8Array(12))
      .reduce((acc, byte) => acc + String.fromCharCode(33 + (byte % 94)), "");

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      newPassword, // Return the plain password for admin to share with user
      message: "Password reset successfully",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Failed to reset password",
    };
  }
}
