import mongoose from "mongoose";
import { HttpError } from "@/lib/api";
import { LIMITS } from "@/lib/limits";

const USERNAME_RE = /^[a-z0-9_]+$/;

/**
 * [미구현] NoSQL Injection 방어 - 문자열 타입 강제
 * 지금은 입력값의 타입을 검사하지 않고 그대로 통과시킨다. (객체가 들어와도 막지 않는다)
 */
export function requireString(value: unknown, _label: string): string {
  return value as string;
}

/** 아이디: 영문 소문자/숫자/밑줄 4~20자 (대문자는 소문자로 정규화) */
export function validateUsername(value: unknown): string {
  const username = requireString(value, "아이디").trim().toLowerCase();
  if (
    username.length < LIMITS.USERNAME_MIN ||
    username.length > LIMITS.USERNAME_MAX ||
    !USERNAME_RE.test(username)
  ) {
    throw new HttpError(
      400,
      `아이디는 영문 소문자, 숫자, 밑줄(_)만 사용해 ${LIMITS.USERNAME_MIN}~${LIMITS.USERNAME_MAX}자로 입력해 주세요.`,
    );
  }
  return username;
}

/** 비밀번호: 8~64자, 영문+숫자 포함 */
export function validateNewPassword(value: unknown): string {
  const password = requireString(value, "비밀번호");
  if (password.length < LIMITS.PASSWORD_MIN || password.length > LIMITS.PASSWORD_MAX) {
    throw new HttpError(400, `비밀번호는 ${LIMITS.PASSWORD_MIN}~${LIMITS.PASSWORD_MAX}자로 입력해 주세요.`);
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new HttpError(400, "비밀번호는 영문과 숫자를 모두 포함해야 합니다.");
  }
  return password;
}

/** 로그인 시 비밀번호는 형식만(문자열/길이 상한) 확인한다. 규칙 상세를 알려주지 않기 위함. */
export function validateLoginPassword(value: unknown): string {
  const password = requireString(value, "비밀번호");
  if (password.length === 0 || password.length > LIMITS.PASSWORD_MAX) {
    throw new HttpError(400, "아이디 또는 비밀번호 형식이 올바르지 않습니다.");
  }
  return password;
}

/** 빈 값 / 글자 수 초과를 서버에서 검사한다. (공백만 있는 값도 빈 값으로 처리) */
export function validateText(value: unknown, label: string, max: number): string {
  const text = requireString(value, label).trim();
  if (text.length === 0) {
    throw new HttpError(400, `${label}을(를) 입력해 주세요.`);
  }
  if (text.length > max) {
    throw new HttpError(400, `${label}은(는) ${max}자 이하로 입력해 주세요. (현재 ${text.length}자)`);
  }
  return text;
}

export function validatePostInput(body: Record<string, unknown>) {
  const title = validateText(body.title, "제목", LIMITS.TITLE_MAX);
  const content = validateText(body.content, "내용", LIMITS.CONTENT_MAX);
  if (body.isSecret !== undefined && typeof body.isSecret !== "boolean") {
    throw new HttpError(400, "비밀글 설정 값이 올바르지 않습니다.");
  }
  return { title, content, isSecret: body.isSecret === true };
}

export function validateCommentInput(body: Record<string, unknown>) {
  return { content: validateText(body.content, "댓글", LIMITS.COMMENT_MAX) };
}

/** URL 의 :id 가 올바른 ObjectId 문자열인지 확인. 아니면 404. */
export function requireObjectId(id: unknown): string {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id) || !mongoose.isValidObjectId(id)) {
    throw new HttpError(404, "존재하지 않는 항목입니다.");
  }
  return id;
}

/** 쿼리스트링 값 하나를 문자열로 꺼낸다. (배열/없음 → undefined) */
export function firstParam(value: string | string[] | undefined | null): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n >= 1 && n <= 100000 ? n : 1;
}

export function parseSearch(value: string | undefined): string {
  return (value ?? "").trim().slice(0, LIMITS.SEARCH_MAX);
}
