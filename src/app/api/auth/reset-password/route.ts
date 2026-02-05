import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the verification token
    const { data: verificationToken, error: tokenError } = await supabase
      .from("VerificationToken")
      .select("*")
      .eq("identifier", email.toLowerCase())
      .eq("token", token)
      .single();

    if (tokenError || !verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(verificationToken.expires) < new Date()) {
      // Delete the expired token
      await supabase
        .from("VerificationToken")
        .delete()
        .eq("identifier", email.toLowerCase())
        .eq("token", token);

      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user's password
    const { error: updateError } = await supabase
      .from("User")
      .update({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Delete the used token
    await supabase
      .from("VerificationToken")
      .delete()
      .eq("identifier", email.toLowerCase())
      .eq("token", token);

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
