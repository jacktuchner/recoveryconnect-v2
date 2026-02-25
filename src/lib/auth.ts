import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user, error } = await supabase
          .from("User")
          .select("id, email, name, passwordHash, role, image, contributorStatus")
          .eq("email", credentials.email)
          .single();

        if (error || !user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          contributorStatus: user.contributorStatus,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.contributorStatus = (user as any).contributorStatus;
      }
      // Refresh role and guide status from DB on each request
      if (token.id) {
        const { data: dbUser } = await supabase
          .from("User")
          .select("role, contributorStatus")
          .eq("id", token.id)
          .single();
        if (dbUser) {
          token.role = dbUser.role;
          token.contributorStatus = dbUser.contributorStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).contributorStatus = token.contributorStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
