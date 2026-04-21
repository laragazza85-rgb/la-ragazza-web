import bcrypt from "bcryptjs";
import { HttpError } from "../utils/httpError.mjs";
import { userRepository } from "../repositories/userRepository.mjs";

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export const authService = {
  async signup({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const cleanPassword = String(password ?? "").trim();

    if (!normalizedEmail || !cleanPassword) {
      throw new HttpError(400, "Email y password son obligatorios.");
    }

    if (cleanPassword.length < 8) {
      throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres.");
    }

    if (userRepository.findByEmail(normalizedEmail)) {
      throw new HttpError(409, "El email ya está registrado.");
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    return userRepository.create({
      email: normalizedEmail,
      passwordHash,
      roleName: "user"
    });
  },

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const cleanPassword = String(password ?? "");

    if (!normalizedEmail || !cleanPassword) {
      throw new HttpError(400, "Email y password son obligatorios.");
    }

    const user = userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new HttpError(401, "Credenciales inválidas.");
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isMatch) {
      throw new HttpError(401, "Credenciales inválidas.");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role_name
    };
  }
};
