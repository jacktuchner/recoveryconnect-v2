import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration attacks
    if (userError || !user) {
      console.log("Password reset requested for non-existent email:", email);
      return NextResponse.json({
        message: "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this user
    await supabase
      .from("VerificationToken")
      .delete()
      .eq("identifier", email.toLowerCase());

    // Create new verification token
    const { error: tokenError } = await supabase.from("VerificationToken").insert({
      identifier: email.toLowerCase(),
      token,
      expires: expires.toISOString(),
    });

    if (tokenError) {
      console.error("Error creating verification token:", tokenError);
      return NextResponse.json(
        { error: "Failed to create reset token" },
        { status: 500 }
      );
    }

    // Send reset email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    const emailResult = await sendPasswordResetEmail(email, resetUrl);

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Don't reveal email sending failures to user
    }

    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
