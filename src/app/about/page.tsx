"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-(--background)/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-medium text-secondary hover:text-primary transition-colors"
          >
            Knowledge History
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/tree"
              className="text-sm text-(--muted) hover:text-secondary transition-colors"
            >
              계보 보기
            </Link>
            <Link
              href="/"
              className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-(--primary)/90 transition-colors"
            >
              게임 시작
            </Link>
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <article className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        {/* 타이틀 */}
        <header className="mb-16 text-center">
          <p className="text-sm text-(--muted) mb-3 tracking-widest">
            ABOUT THIS WORK
          </p>
          <h1 className="text-4xl font-semibold text-secondary mb-4 leading-tight">
            지식은 어떻게
            <br />
            전해지는가
          </h1>
        </header>

        {/* 본문 */}
        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          {/* 섹션 1: 지식의 전승 */}
          <section>
            <p className="text-lg leading-relaxed">
              인류의 지식은 대대로 <em>구전</em>되거나 <em>기록</em>되어 전해져
              왔다. 수천 년 동안 이야기꾼들은 모닥불 앞에서 신화를 전했고,
              필경사들은 양피지 위에 역사를 남겼다.
            </p>
          </section>

          {/* 섹션 2: 변형되는 지식 */}
          <section>
            <p className="text-lg leading-relaxed">
              그러나 지식은 온전히 전해지지 않는다. 기록자의{" "}
              <strong>의도</strong>와 <strong>상황</strong>에 따라 취사선택되고,
              덧붙여지고, 변형된다. 우리가 아는 역사는 승자의 기록이며, 신화는
              시대의 필요에 맞게 재해석된 이야기다.
            </p>
          </section>

          {/* 구분선 */}
          <div className="flex items-center justify-center py-8">
            <span className="text-2xl text-(--muted)">✦</span>
          </div>

          {/* 섹션 3: AI 시대 */}
          <section>
            <p className="text-lg leading-relaxed">
              오늘날, 새로운 기록자가 등장했다.
            </p>
            <p className="text-lg leading-relaxed">
              유튜브 쇼츠, 틱톡, 인스타그램 — 주류 인터넷에는
              <strong>AI가 생산한 콘텐츠</strong>가 넘쳐난다. 그리고 AI가
              만들어낸 정보는 다시 AI의 학습 데이터가 된다. 지식이 지식을 낳고,
              그 지식이 다시 지식을 낳는다.
            </p>
          </section>

          {/* 섹션 4: 할루시네이션 */}
          <section>
            <p className="text-lg leading-relaxed">
              AI는 <em>할루시네이션</em>이라는 특성을 가진다. 정보의 정확성을
              따지기보다,
              <strong>그럴듯한 답변을 내놓는 것</strong>에 집중한다. 진실보다
              설득력이 우선되는 시대. 우리는 묻는다 — 지식이란 무엇인가?
            </p>
          </section>

          {/* 구분선 */}
          <div className="flex items-center justify-center py-8">
            <span className="text-2xl text-(--muted)">✦ ✦</span>
          </div>

          {/* 섹션 5: 게임 설명 */}
          <section className="bg-(--paper) border border-gray-200 rounded-xl p-8 my-12">
            <h2 className="text-xl font-medium text-secondary mb-4">
              당신의 역할
            </h2>
            <p className="text-lg leading-relaxed mb-4">
              이 게임에서 당신은 <strong>정해진 시간 안에</strong> 질문에 답해야
              한다.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              당신의 목표는 오직 <em>답변하는 것</em>. 정확할 필요 없다. 무슨
              말을 하든 상관없다. 중요한 것은 지식의 흐름에 참여하는 것이다.
            </p>
            <p className="text-base text-(--muted)">
              ※ 이 게임에 사용된 시드 지식은 모두 현실에 존재하지 않는{" "}
              <strong>허구의 지식</strong>입니다.
            </p>
          </section>

          {/* 마무리 */}
          <section className="text-center pt-8">
            <p className="text-xl font-medium text-secondary mb-2">
              지식의 흐름에 참여하라.
            </p>
            <p className="text-lg text-(--muted)">
              그리고 지식이 전해져가는 계보를 확인하라.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <Link
            href="/"
            className="px-8 py-4 bg-primary text-white text-lg rounded-xl hover:bg-(--primary)/90 transition-colors"
          >
            게임 시작하기
          </Link>
          <Link
            href="/tree"
            className="text-(--muted) hover:text-secondary transition-colors"
          >
            계보 둘러보기 →
          </Link>
        </div>
      </article>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center text-sm text-(--muted)">
          <p>Knowledge History — 지식 계보 게임</p>
        </div>
      </footer>
    </main>
  );
}
