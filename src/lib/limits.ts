/** 서버(검증)와 브라우저(입력창 maxLength 안내)가 함께 쓰는 값. 서버 전용 코드를 import 하지 않는다. */
export const LIMITS = {
  USERNAME_MIN: 4,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 64, // bcrypt 는 72바이트 이후를 무시하므로 여유를 두고 제한
  TITLE_MAX: 100,
  CONTENT_MAX: 5000,
  COMMENT_MAX: 500,
  SEARCH_MAX: 50,
} as const;
