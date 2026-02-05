import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/user/settings - Get current user's settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("id, name, displayName, showRealName, bio")
      .eq("id", (session.user as any).id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      name: user.name,
      displayName: user.displayName,
      showRealName: user.showRealName ?? true,
      bio: user.bio || "",
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/user/settings - Update user's privacy settings and bio
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, showRealName, bio } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof displayName === "string") {
      // Validate display name
      const trimmed = displayName.trim();
      if (trimmed.length > 0 && trimmed.length < 2) {
        return NextResponse.json(
          { error: "Display name must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (trimmed.length > 50) {
        return NextResponse.json(
          { error: "Display name must be 50 characters or less" },
          { status: 400 }
        );
      }
      updateData.displayName = trimmed || null;
    }

    if (typeof showRealName === "boolean") {
      updateData.showRealName = showRealName;
    }

    if (typeof bio === "string") {
      // Validate bio length
      if (bio.length > 500) {
        return NextResponse.json(
          { error: "Bio must be 500 characters or less" },
          { status: 400 }
        );
      }
      updateData.bio = bio || null;
    }

    const { data: user, error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", (session.user as any).id)
      .select("id, name, displayName, showRealName, bio")
      .single();

    if (error) throw error;

    return NextResponse.json({
      name: user.name,
      displayName: user.displayName,
      showRealName: user.showRealName ?? true,
      bio: user.bio || "",
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
