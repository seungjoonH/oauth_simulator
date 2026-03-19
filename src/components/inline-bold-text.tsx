import { Fragment } from "react";

/**
 * 문자열 안의 `**강조**`를 <strong>으로 렌더합니다. (에듀 콜아웃용 미니 마크다운)
 * 닫히지 않은 `**`는 그대로 표시합니다.
 */
export function InlineBoldText({
  text,
  strongClassName = "font-semibold text-[#0d0d0d]",
}: {
  text: string;
  /** strong 태그에만 적용 (부모 타이포는 그대로 상속) */
  strongClassName?: string;
}) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {segments.map((seg, i) => {
        const m = /^\*\*([^*]+)\*\*$/.exec(seg);
        if (m) {
          return (
            <strong key={i} className={strongClassName}>
              {m[1]}
            </strong>
          );
        }
        return <Fragment key={i}>{seg}</Fragment>;
      })}
    </>
  );
}
