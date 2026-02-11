import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const isContributorIntent = role === "CONTRIBUTOR" || role === "BOTH";
    const effectiveRole = isContributorIntent ? "CONTRIBUTOR" : "PATIENT";

    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id: uuidv4(),
        name,
        email,
        passwordHash,
        role: effectiveRole,
        ...(isContributorIntent && { contributorStatus: "PENDING_REVIEW" }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select("id, name, email, role, contributorStatus")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Send welcome email (don't block on this)
    sendWelcomeEmail(user.email, user.name, user.role).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(isContributorIntent && { redirect: "/contributor-application" }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
