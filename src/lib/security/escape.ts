/**
 * [XSS 방어 - 입력 치환]
 * 게시글/댓글에 들어온 특수기호를 HTML 엔티티(글자)로 치환해서 저장한다.
 *   <  →  &lt;     >  →  &gt;     &  →  &amp;     "  →  &quot;     '  →  &#39;
 * 이렇게 저장하면 DB 의 값을 어디서 어떻게 출력하더라도 <script> 가 "태그"가 아니라 "글자"로만 취급된다.
 */
const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const UNESCAPE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/**
 * 화면에 보여줄 때 사용자가 입력한 원래 글자로 되돌린다.
 * 되돌린 문자열은 반드시 React 의 텍스트 노드({value})로만 출력한다.
 * React 가 출력 시점에 다시 한 번 이스케이프하므로 안전하다. (dangerouslySetInnerHTML 금지)
 */
export function unescapeHtml(input: string): string {
  return input.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => UNESCAPE_MAP[entity]);
}

/** 검색어를 정규식에 안전하게 넣기 위해 정규식 특수문자를 이스케이프한다. (ReDoS/정규식 인젝션 방지) */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
