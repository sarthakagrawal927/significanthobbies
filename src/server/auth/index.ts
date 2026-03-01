import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { authOptions } from "./config";

export { authOptions };

export const getServerAuthSession = () => getServerSession(authOptions);
