import NextAuth from "next-auth";
import { authOptions } from "./config";

export { authOptions };

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
