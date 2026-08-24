import bcrypt from "bcrypt";
import { supabase } from "../db";

export interface User {
  id: number;
  email: string;
  name: string;
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({ email, name, password_hash: hash })
    .select("id, email, name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create user");
  }

  return data as User;
}

export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, password_hash")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error("Invalid credentials");
  }

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) {
    throw new Error("Invalid credentials");
  }

  const { password_hash, ...user } = data;
  return user as User;
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}
