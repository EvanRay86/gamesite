"use client";

import { Section } from "@/components/calculus/ui";
import { M } from "@/components/calculus/Math";

function Pair({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-light py-1.5 last:border-0">
      <M>{a}</M>
      <M>{b}</M>
    </div>
  );
}

function Card({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`clay-card p-4 border-t-4 border-${color}`}>
      <h4 className={`mb-2 font-bold text-${color}`}>{title}</h4>
      <div className="text-[15px]">{children}</div>
    </div>
  );
}

export default function CheatSheetSection() {
  return (
    <Section
      id="cheatsheet"
      number="📋"
      accent="sky"
      title="Formula Cheat Sheet"
      subtitle="Every rule on this page, in one scannable place. Bookmark it."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Derivative Rules" color="coral">
          <Pair a="(cf)'" b="c\,f'" />
          <Pair a="(f \pm g)'" b="f' \pm g'" />
          <Pair a="(fg)'" b="f'g + fg'" />
          <Pair a="\left(\tfrac{f}{g}\right)'" b="\tfrac{f'g - fg'}{g^2}" />
          <Pair a="\big(f(g(x))\big)'" b="f'(g)\,g'" />
        </Card>

        <Card title="Common Derivatives" color="amber">
          <Pair a="\tfrac{d}{dx}x^n" b="n x^{n-1}" />
          <Pair a="\tfrac{d}{dx}e^x" b="e^x" />
          <Pair a="\tfrac{d}{dx}\ln x" b="\tfrac{1}{x}" />
          <Pair a="\tfrac{d}{dx}\sin x" b="\cos x" />
          <Pair a="\tfrac{d}{dx}\cos x" b="-\sin x" />
          <Pair a="\tfrac{d}{dx}\tan x" b="\sec^2 x" />
        </Card>

        <Card title="Common Integrals" color="green">
          <Pair a="\int x^n\,dx" b="\tfrac{x^{n+1}}{n+1}+C" />
          <Pair a="\int \tfrac{1}{x}\,dx" b="\ln|x|+C" />
          <Pair a="\int e^x\,dx" b="e^x+C" />
          <Pair a="\int \cos x\,dx" b="\sin x+C" />
          <Pair a="\int \sin x\,dx" b="-\cos x+C" />
          <Pair a="\int \sec^2 x\,dx" b="\tan x+C" />
        </Card>

        <Card title="Integration Methods" color="teal">
          <Pair a="\int u\,dv" b="uv-\int v\,du" />
          <Pair a="u\text{-sub}" b="u=g(x),\ du=g'\,dx" />
          <Pair a="\int_a^b f\,dx" b="F(b)-F(a)" />
          <Pair a="\bar f" b="\tfrac{1}{b-a}\int_a^b f\,dx" />
        </Card>

        <Card title="Key Limits" color="purple">
          <Pair a="\lim_{x\to 0}\tfrac{\sin x}{x}" b="1" />
          <Pair a="\lim_{x\to\infty}\left(1+\tfrac{1}{x}\right)^x" b="e" />
          <Pair a="\lim_{x\to 0}\tfrac{1-\cos x}{x}" b="0" />
          <Pair a="\tfrac{0}{0},\ \tfrac{\infty}{\infty}" b="\text{use L'Hôpital}" />
        </Card>

        <Card title="Series & Applications" color="sky">
          <Pair a="\sum ar^n" b="\tfrac{a}{1-r},\ |r|<1" />
          <Pair a="V_{\text{disk}}" b="\pi\int f^2\,dx" />
          <Pair a="L_{\text{arc}}" b="\int\sqrt{1+(f')^2}\,dx" />
          <Pair a="\nabla f" b="\langle f_x, f_y\rangle" />
        </Card>
      </div>
    </Section>
  );
}
