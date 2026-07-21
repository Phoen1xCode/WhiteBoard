import type { Context } from "koa";
import { AppError } from "../lib/app-error";
import { success } from "../lib/response";
import * as authService from "../services/auth-service";
import type { JwtTokenPayload } from "../types/auth";

interface RequestWithBody<TBody> {
  body: TBody;
}

export interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface LogoutBody {
  refreshToken?: string;
}

function getRequestBody<TBody>(ctx: Context): TBody {
  return (ctx.request as typeof ctx.request & RequestWithBody<TBody>).body;
}

function getJwtPayload(ctx: Context): JwtTokenPayload {
  const payload = ctx.state.jwtPayload;

  if (!payload) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return payload;
}

export async function register(ctx: Context): Promise<void> {
  const result = await authService.register(getRequestBody<RegisterBody>(ctx));
  ctx.status = 201;
  ctx.body = success(result);
}

export async function login(ctx: Context): Promise<void> {
  const result = await authService.login(getRequestBody<LoginBody>(ctx));
  ctx.body = success(result);
}

export async function refresh(ctx: Context): Promise<void> {
  const result = await authService.refresh(getRequestBody<RefreshBody>(ctx));
  ctx.body = success(result);
}

export async function logout(ctx: Context): Promise<void> {
  const body = getRequestBody<LogoutBody>(ctx);
  await authService.logout({
    accessTokenPayload: getJwtPayload(ctx),
    refreshToken: body.refreshToken,
  });
  ctx.body = success({ loggedOut: true });
}

export async function me(ctx: Context): Promise<void> {
  const payload = getJwtPayload(ctx);
  const user = await authService.getMe(payload.sub);
  ctx.body = success({ user });
}
