import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card empty-card">
      <h1 className="page-title">페이지를 찾을 수 없습니다</h1>
      <p className="muted">주소가 잘못되었거나 삭제된 게시글일 수 있습니다.</p>
      <Link href="/" className="btn btn-primary">
        게시판으로 돌아가기
      </Link>
    </div>
  );
}
