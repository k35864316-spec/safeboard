import { TOPICS } from "./securityTopics";

/** 보안 기능 설명(TOPICS)을 게시글(제목/본문 글자) 형태로 바꾼다. 시드 스크립트가 사용한다. */
export function buildSecurityPosts() {
  return TOPICS.map((t, i) => {
    const L: string[] = [];
    L.push(`${t.icon} ${t.title}`, `담당: ${t.owner}`, "", `▶ ${t.summary}`, "");
    L.push("■ 1. 어떤 취약점인가요?", ...t.what.map((w) => `- ${w}`), "");
    L.push(
      `■ 2. ${t.attackTitle}`,
      ...t.attackSteps.map((s, k) => `${k + 1}) ${s}`),
      "",
      `[${t.vulnerable.caption}]`,
      t.vulnerable.code,
      "",
    );
    L.push("■ 3. 세이프보드의 방어 방법");
    t.defenses.forEach((d, k) => {
      L.push("", `(${k + 1}) ${d.title}`, `파일: ${d.file}`, d.explain, d.code);
    });
    L.push("", "■ 4. 이 사이트의 어디에 적용됐나요?", ...t.applied.map((a) => `- ${a}`), "");
    L.push("■ 5. 직접 확인해 보기 (시연)", ...t.demo.map((s, k) => `${k + 1}) ${s}`));
    if (t.demoCode) L.push("", `[${t.demoCode.caption}]`, t.demoCode.code);
    L.push("", `※ 참고: ${t.limits}`);
    return { title: `[보안 ${i + 1}/${TOPICS.length}] ${t.title}`, content: L.join("\n") };
  });
}
