import type {
  AuthResult,
  LoginInput,
  RegisterInput,
  UserResponse,
} from "@whiteboard/shared/schemas";

import { APIError } from "better-auth/api";

import { db } from "@/db";
import { auth, bearerHeaders, isJWT, issueAccessToken } from "@/lib/auth";
import { HttpError } from "@/lib/errors";

type BetterAuthUser = typeof auth.$Infer.Session.user;

function toUserResponse(user: BetterAuthUser): UserResponse {
  return {
    id: user.id,
    email: user.email,
    username: user.username ?? user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** JWT access token + Better Auth session token as refresh. */
async function createAuthResult(user: BetterAuthUser, sessionToken: string): Promise<AuthResult> {
  return {
    user: toUserResponse(user),
    tokens: {
      accessToken: await issueAccessToken(sessionToken),
      refreshToken: sessionToken,
    },
  };
}

async function register(input: RegisterInput, headers: Headers): Promise<AuthResult> {
  if (await db.user.findUnique({ where: { email: input.email } })) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
  }
  if (await db.user.findUnique({ where: { username: input.username.toLowerCase() } })) {
    throw new HttpError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
  }

  let result;
  try {
    result = await auth.api.signUpEmail({
      headers,
      body: {
        email: input.email,
        password: input.password,
        name: input.username,
        username: input.username,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "USERNAME_IS_ALREADY_TAKEN") {
        throw new HttpError(409, "USERNAME_ALREADY_EXISTS", "Username already exists");
      }
      if (error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
      }
    }
    throw error;
  }

  if (!result.token) {
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Failed to create session");
  }
  return await createAuthResult(result.user, result.token);
}

async function login(input: LoginInput, headers: Headers): Promise<AuthResult> {
  let result;
  try {
    result = await auth.api.signInEmail({
      headers,
      body: { email: input.email, password: input.password },
    });
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    throw error;
  }

  if (!result.token) {
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Failed to create session");
  }
  return await createAuthResult(result.user, result.token);
}

async function refresh(refreshToken: string): Promise<AuthResult> {
  const result = await auth.api.getSession({ headers: bearerHeaders(refreshToken) });
  if (!result) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid refresh token");
  }
  return await createAuthResult(result.user, result.session.token);
}

async function logout(accessToken: string, refreshToken?: string): Promise<void> {
  const sessionToken = [refreshToken, accessToken].find((token) => token && !isJWT(token));
  if (sessionToken) {
    await auth.api.signOut({ headers: bearerHeaders(sessionToken) });
    return;
  }

  const verified = await auth.api.verifyJWT({ body: { token: accessToken } });
  const userId = verified?.payload?.sub;
  if (userId) {
    await db.session.deleteMany({ where: { userId } });
  }
}

async function getMe(userId: string): Promise<UserResponse> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return toUserResponse(user);
}

export const authService = { register, login, refresh, logout, getMe };
