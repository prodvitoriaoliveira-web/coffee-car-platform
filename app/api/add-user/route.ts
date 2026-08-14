import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as repo from "@/lib/repo";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const name = req.nextUrl.searchParams.get("name");
  const email = req.nextUrl.searchParams.get("email");
  const role = req.nextUrl.searchParams.get("role") === "ADMIN" ? "ADMIN" : "SOCIO";
  const password = req.nextUrl.searchParams.get("password") ?? "cafe2026!";

  if (!name || !email) {
    return NextResponse.json({ error: "faltam parâmetros name e/ou email" }, { status: 400 });
  }

  const existing = await repo.getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ message: "usuário já existe, nada foi alterado", email });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await repo.createUser({ name, email, passwordHash, role });

  return NextResponse.json({ message: "usuário criado", name, email, role, password });
}
