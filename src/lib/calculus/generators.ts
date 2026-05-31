// ─────────────────────────────────────────────────────────────────────────────
// generators.ts — randomized practice-problem catalog for every chapter.
//
// Each Generator.generate() returns a fully self-contained problem: the prompt
// (LaTeX), the answer (LaTeX, revealed on demand), step-by-step worked solution,
// and a `check()` that grades a student's typed answer.
//
// Answer checking is numeric, so algebraically different but equivalent forms
// are accepted. Indefinite integrals are graded by differentiating the student's
// answer and comparing to the integrand — which makes "+C" handled for free.
// ─────────────────────────────────────────────────────────────────────────────

import { compile, expressionsEqual } from "./expression";
import { derivative, fmtNice } from "./numeric";

export type InputKind = "expression" | "number" | "choice";

export interface Choice {
  tex: string;
  correct: boolean;
}

export interface GeneratedProblem {
  promptTex: string;
  lead?: string;
  inputKind: InputKind;
  placeholder?: string;
  choices?: Choice[];
  /** Grade a typed answer (expression / number kinds). */
  check?: (input: string) => boolean;
  answerTex: string;
  steps: string[]; // each entry may contain $...$ LaTeX
}

export interface Generator {
  id: string;
  topic: string;
  title: string;
  difficulty: 1 | 2 | 3;
  generate: () => GeneratedProblem;
}

// ── RNG + formatting helpers ─────────────────────────────────────────────────

const ri = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const rnz = (lo: number, hi: number) => {
  let v = 0;
  while (v === 0) v = ri(lo, hi);
  return v;
};
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Format a single power term coef·x^exp as LaTeX (handles 1, 0, signs). */
function term(coef: number, exp: number, v = "x"): string {
  if (coef === 0) return "";
  const sign = coef < 0 ? "-" : "";
  const a = Math.abs(coef);
  if (exp === 0) return `${sign}${a}`;
  const base = exp === 1 ? v : `${v}^{${exp}}`;
  const c = a === 1 ? "" : a;
  return `${sign}${c}${base}`;
}

/** Join terms (already signed) into a polynomial, fixing "+-" → "-". */
function poly(terms: string[]): string {
  const parts = terms.filter(Boolean);
  if (!parts.length) return "0";
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) {
    out += parts[i].startsWith("-") ? parts[i] : `+${parts[i]}`;
  }
  return out;
}

/** Build a check() for an exact symbolic expression answer. */
function exprCheck(correct: string) {
  return (input: string) => expressionsEqual(input, correct);
}

/** Build a check() that grades an antiderivative by differentiating the answer. */
function antiderivCheck(integrandSrc: string) {
  return (input: string) => {
    try {
      const stu = compile(input);
      const g = compile(integrandSrc);
      const samples = [-1.7, -0.6, 0.35, 1.2, 2.1, 3.4];
      let cnt = 0;
      for (const x of samples) {
        const d = derivative(stu.fn, x);
        const gv = g.fn(x);
        if (!Number.isFinite(d) || !Number.isFinite(gv)) continue;
        if (Math.abs(d - gv) > 1e-3 * Math.max(1, Math.abs(gv))) return false;
        cnt++;
      }
      return cnt > 0;
    } catch {
      return false;
    }
  };
}

/** Build a check() for a numeric answer. */
function numCheck(value: number, tol = 1e-2) {
  return (input: string) => {
    const v = parseFloat(input.replace(/[^0-9.eE+-/]/g, ""));
    if (input.includes("/")) {
      const [p, q] = input.split("/").map(Number);
      if (q) return Math.abs(p / q - value) <= tol;
    }
    return Number.isFinite(v) && Math.abs(v - value) <= tol;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIMITS
// ─────────────────────────────────────────────────────────────────────────────

/** LaTeX for a linear factor (x - root), correctly signed: (x-3), (x+3), or x. */
function factorTex(root: number): string {
  if (root === 0) return "x";
  return root > 0 ? `(x - ${root})` : `(x + ${-root})`;
}

const limitFactor: Generator = {
  id: "limit-factor",
  topic: "limits",
  title: "Limits by Factoring (0/0)",
  difficulty: 2,
  generate: () => {
    // lim x→a of (x-a)(x-b)/(x-a) = x-b → a-b
    const a = rnz(-5, 5);
    let b = rnz(-5, 5);
    while (b === a) b = rnz(-5, 5);
    // Expanded numerator (x-a)(x-b) = x² - (a+b)x + ab, formatted cleanly.
    const num = poly(["x^{2}", term(-(a + b), 1), term(a * b, 0)]);
    const ans = a - b;
    const linA = factorTex(a);
    const linB = factorTex(b);
    return {
      promptTex: `\\lim_{x \\to ${a}} \\dfrac{${num}}{${linA}}`,
      lead: "Evaluate the limit.",
      inputKind: "number",
      placeholder: "a number",
      check: numCheck(ans),
      answerTex: `${ans}`,
      steps: [
        `Direct substitution gives $\\tfrac{0}{0}$ — an indeterminate form, so factor.`,
        `Factor the numerator: $${num} = ${linA}\\,${linB}$.`,
        `Cancel the common factor $${linA}$, leaving $${linB.replace(/[()]/g, "")}$.`,
        `Substitute $x = ${a}$: the limit is $${ans}$.`,
      ],
    };
  },
};

const limitInfinity: Generator = {
  id: "limit-infinity",
  topic: "limits",
  title: "Limits at Infinity (rational)",
  difficulty: 2,
  generate: () => {
    const deg = pick([0, 1, 2]); // relationship of degrees
    const a = rnz(2, 9);
    const b = rnz(2, 9);
    if (deg === 0) {
      // equal degree → ratio of leading coefficients
      const ans = a / b;
      return {
        promptTex: `\\lim_{x \\to \\infty} \\dfrac{${a}x^{2}+${ri(1, 5)}x}{${b}x^{2}-${ri(1, 5)}}`,
        lead: "Evaluate the limit.",
        inputKind: "number",
        placeholder: "a number or fraction",
        check: numCheck(ans, 1e-3),
        answerTex: fmtNice(ans),
        steps: [
          `Top and bottom have the same degree (2), so divide every term by $x^{2}$.`,
          `Lower-order terms vanish as $x \\to \\infty$.`,
          `The limit is the ratio of leading coefficients: $\\dfrac{${a}}{${b}} = ${fmtNice(ans)}$.`,
        ],
      };
    } else if (deg === 1) {
      // bottom degree higher → 0
      return {
        promptTex: `\\lim_{x \\to \\infty} \\dfrac{${a}x+${ri(1, 6)}}{${b}x^{2}+${ri(1, 6)}}`,
        lead: "Evaluate the limit.",
        inputKind: "number",
        placeholder: "a number",
        check: numCheck(0, 1e-3),
        answerTex: `0`,
        steps: [
          `The denominator's degree (2) exceeds the numerator's (1).`,
          `Dividing by $x^{2}$ sends the top to 0 and the bottom to ${b}.`,
          `So the limit is $0$.`,
        ],
      };
    }
    // top degree higher → ±∞
    return {
      promptTex: `\\lim_{x \\to \\infty} \\dfrac{${a}x^{2}+${ri(1, 6)}x}{${b}x+${ri(1, 6)}}`,
      lead: "Evaluate the limit (enter the word infinity, or a number).",
      inputKind: "choice",
      choices: [
        { tex: "+\\infty", correct: true },
        { tex: "0", correct: false },
        { tex: `${fmtNice(a / b)}`, correct: false },
        { tex: "-\\infty", correct: false },
      ],
      answerTex: "+\\infty",
      steps: [
        `The numerator's degree (2) exceeds the denominator's (1).`,
        `The top grows much faster, so the quotient grows without bound.`,
        `The limit is $+\\infty$.`,
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DERIVATIVES
// ─────────────────────────────────────────────────────────────────────────────

const powerRule: Generator = {
  id: "deriv-power",
  topic: "derivatives",
  title: "Power Rule",
  difficulty: 1,
  generate: () => {
    const a = rnz(2, 6);
    const n = ri(2, 5);
    const b = rnz(2, 8);
    const m = ri(1, 3);
    const c = ri(1, 9);
    const fn = poly([term(a, n), term(b, m), `${c}`]);
    // f' = a·n x^(n-1) + b·m x^(m-1)
    const dTerms = [term(a * n, n - 1), term(b * m, m - 1)];
    const der = poly(dTerms);
    const correctSrc = `${a * n}*x^${n - 1} + ${b * m}*x^${m - 1}`;
    return {
      promptTex: `f(x) = ${fn} \\quad\\Rightarrow\\quad f'(x) = \\,?`,
      lead: "Differentiate using the power rule.",
      inputKind: "expression",
      placeholder: "e.g. 6x^2 + 4x",
      check: exprCheck(correctSrc),
      answerTex: der,
      steps: [
        `Power rule: $\\frac{d}{dx}x^{n} = n x^{n-1}$. Apply term by term.`,
        `$\\frac{d}{dx}(${term(a, n)}) = ${term(a * n, n - 1)}$.`,
        `$\\frac{d}{dx}(${term(b, m)}) = ${term(b * m, m - 1)}$.`,
        `The constant ${c} differentiates to 0, so $f'(x) = ${der}$.`,
      ],
    };
  },
};

const productRule: Generator = {
  id: "deriv-product",
  topic: "derivatives",
  title: "Product Rule",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 5);
    const b = rnz(1, 6);
    const c = rnz(2, 5);
    const d = rnz(1, 6);
    // f = (a x + b)(c x² + d) ; f' = a(cx²+d) + (ax+b)(2cx)
    const correctSrc = `${a}*(${c}*x^2+${d}) + (${a}*x+${b})*(${2 * c}*x)`;
    return {
      promptTex: `f(x) = (${term(a, 1)}${b >= 0 ? "+" : ""}${b})(${term(c, 2)}${d >= 0 ? "+" : ""}${d})`,
      lead: "Differentiate using the product rule.",
      inputKind: "expression",
      placeholder: "your simplified derivative",
      check: exprCheck(correctSrc),
      answerTex: `${a}(${term(c, 2)}+${d}) + (${term(a, 1)}+${b})(${2 * c}x)`,
      steps: [
        `Product rule: $(uv)' = u'v + uv'$.`,
        `Let $u = ${term(a, 1)}+${b}$ so $u' = ${a}$, and $v = ${term(c, 2)}+${d}$ so $v' = ${2 * c}x$.`,
        `Then $f'(x) = ${a}(${term(c, 2)}+${d}) + (${term(a, 1)}+${b})(${2 * c}x)$.`,
      ],
    };
  },
};

const quotientRule: Generator = {
  id: "deriv-quotient",
  topic: "derivatives",
  title: "Quotient Rule",
  difficulty: 3,
  generate: () => {
    const a = rnz(2, 5);
    const b = rnz(1, 5);
    const c = rnz(1, 4);
    // f = (a x + b)/(x + c); f' = [a(x+c) - (ax+b)]/(x+c)² = (ac - b)/(x+c)²
    const top = a * c - b;
    const correctSrc = `(${top})/((x+${c})^2)`;
    return {
      promptTex: `f(x) = \\dfrac{${term(a, 1)}+${b}}{x+${c}}`,
      lead: "Differentiate using the quotient rule. Simplify.",
      inputKind: "expression",
      placeholder: "e.g. 7/(x+3)^2",
      check: exprCheck(correctSrc),
      answerTex: `\\dfrac{${top}}{(x+${c})^{2}}`,
      steps: [
        `Quotient rule: $\\left(\\frac{u}{v}\\right)' = \\dfrac{u'v - uv'}{v^{2}}$.`,
        `$u = ${term(a, 1)}+${b},\\ u' = ${a}$;  $v = x+${c},\\ v' = 1$.`,
        `Numerator: $${a}(x+${c}) - (${term(a, 1)}+${b}) = ${a * c} - ${b} = ${top}$.`,
        `So $f'(x) = \\dfrac{${top}}{(x+${c})^{2}}$.`,
      ],
    };
  },
};

const chainRule: Generator = {
  id: "deriv-chain",
  topic: "derivatives",
  title: "Chain Rule",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 5);
    const b = rnz(1, 6);
    const n = ri(2, 4);
    // f = (a x + b)^n; f' = n(ax+b)^(n-1)·a
    const correctSrc = `${n * a}*(${a}*x+${b})^${n - 1}`;
    return {
      promptTex: `f(x) = (${term(a, 1)}+${b})^{${n}}`,
      lead: "Differentiate using the chain rule.",
      inputKind: "expression",
      placeholder: `e.g. ${n * a}(${a}x+${b})^${n - 1}`,
      check: exprCheck(correctSrc),
      answerTex: `${n * a}(${term(a, 1)}+${b})^{${n - 1}}`,
      steps: [
        `Chain rule: differentiate the outside, keep the inside, times the inside's derivative.`,
        `Outside: $\\frac{d}{du}u^{${n}} = ${n}u^{${n - 1}}$ with $u = ${term(a, 1)}+${b}$.`,
        `Inside derivative: $\\frac{d}{dx}(${term(a, 1)}+${b}) = ${a}$.`,
        `Multiply: $f'(x) = ${n}(${term(a, 1)}+${b})^{${n - 1}} \\cdot ${a} = ${n * a}(${term(a, 1)}+${b})^{${n - 1}}$.`,
      ],
    };
  },
};

const trigDeriv: Generator = {
  id: "deriv-trig",
  topic: "derivatives",
  title: "Trig & Chain",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 5);
    const which = pick(["sin", "cos"] as const);
    // f = sin(a x) → a cos(a x);  cos(a x) → -a sin(a x)
    const correctSrc =
      which === "sin" ? `${a}*cos(${a}*x)` : `-${a}*sin(${a}*x)`;
    const ansTex =
      which === "sin" ? `${a}\\cos(${a}x)` : `-${a}\\sin(${a}x)`;
    return {
      promptTex: `f(x) = \\${which}(${a}x)`,
      lead: "Differentiate.",
      inputKind: "expression",
      placeholder: "use sin( ) / cos( )",
      check: exprCheck(correctSrc),
      answerTex: ansTex,
      steps: [
        `$\\frac{d}{dx}\\${which}(u) = ${which === "sin" ? "\\cos" : "-\\sin"}(u)\\cdot u'$.`,
        `Here $u = ${a}x$, so $u' = ${a}$.`,
        `Therefore $f'(x) = ${ansTex}$.`,
      ],
    };
  },
};

const expLogDeriv: Generator = {
  id: "deriv-explog",
  topic: "derivatives",
  title: "Exponential & Log",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 5);
    const kind = pick(["exp", "ln"] as const);
    if (kind === "exp") {
      const correctSrc = `${a}*exp(${a}*x)`;
      return {
        promptTex: `f(x) = e^{${a}x}`,
        lead: "Differentiate.",
        inputKind: "expression",
        placeholder: "use exp( )",
        check: exprCheck(correctSrc),
        answerTex: `${a}e^{${a}x}`,
        steps: [
          `$\\frac{d}{dx}e^{u} = e^{u}\\cdot u'$.`,
          `$u = ${a}x \\Rightarrow u' = ${a}$.`,
          `So $f'(x) = ${a}e^{${a}x}$.`,
        ],
      };
    }
    const correctSrc = `1/x`;
    return {
      promptTex: `f(x) = \\ln(${a}x)`,
      lead: "Differentiate.",
      inputKind: "expression",
      placeholder: "e.g. 1/x",
      check: exprCheck(correctSrc),
      answerTex: `\\dfrac{1}{x}`,
      steps: [
        `$\\frac{d}{dx}\\ln(u) = \\dfrac{u'}{u}$.`,
        `$u = ${a}x \\Rightarrow u' = ${a}$, so $\\dfrac{${a}}{${a}x} = \\dfrac{1}{x}$.`,
        `Interesting: the constant ${a} cancels — $\\ln(${a}x)$ and $\\ln(x)$ have the same derivative.`,
      ],
    };
  },
};

const tangentLine: Generator = {
  id: "deriv-tangent",
  topic: "applications-deriv",
  title: "Tangent Line",
  difficulty: 2,
  generate: () => {
    const a = rnz(1, 3);
    const b = rnz(-4, 4);
    const x0 = ri(-2, 3);
    // f = a x² + b x ; f(x0), f'(x0) = 2a x0 + b
    const fx0 = a * x0 * x0 + b * x0;
    const slope = 2 * a * x0 + b;
    // tangent: y = slope (x - x0) + fx0  → slope x + (fx0 - slope x0)
    const intercept = fx0 - slope * x0;
    const correctSrc = `${slope}*x+${intercept}`;
    return {
      promptTex: `f(x) = ${poly([term(a, 2), term(b, 1)])},\\quad \\text{tangent at } x = ${x0}`,
      lead: "Find the equation of the tangent line (solve for y).",
      inputKind: "expression",
      placeholder: "e.g. 5x-2",
      check: exprCheck(correctSrc),
      answerTex: `y = ${poly([term(slope, 1), `${intercept}`])}`,
      steps: [
        `Point: $f(${x0}) = ${fx0}$, so the line passes through $(${x0}, ${fx0})$.`,
        `Slope: $f'(x) = ${poly([term(2 * a, 1), `${b}`])}$, so $f'(${x0}) = ${slope}$.`,
        `Point-slope: $y - ${fx0} = ${slope}(x - ${x0})$.`,
        `Simplify: $y = ${poly([term(slope, 1), `${intercept}`])}$.`,
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRALS
// ─────────────────────────────────────────────────────────────────────────────

const indefinitePower: Generator = {
  id: "int-power",
  topic: "integrals",
  title: "Indefinite Integral (power rule)",
  difficulty: 1,
  generate: () => {
    const a = rnz(2, 6);
    const n = ri(1, 4);
    const b = rnz(1, 6);
    // ∫(a x^n + b) dx = a/(n+1) x^(n+1) + b x + C
    const integrand = `${a}*x^${n} + ${b}`;
    const c1 = a / (n + 1);
    return {
      promptTex: `\\int \\left(${poly([term(a, n), `${b}`])}\\right)\\,dx`,
      lead: "Find the indefinite integral (don't forget + C).",
      inputKind: "expression",
      placeholder: `e.g. ${fmtNice(c1)}x^${n + 1} + ${b}x`,
      check: antiderivCheck(integrand),
      answerTex: `${fmtNice(c1)}x^{${n + 1}} + ${b}x + C`,
      steps: [
        `Reverse power rule: $\\int x^{n}\\,dx = \\dfrac{x^{n+1}}{n+1} + C$.`,
        `$\\int ${term(a, n)}\\,dx = \\dfrac{${a}}{${n + 1}}x^{${n + 1}} = ${fmtNice(c1)}x^{${n + 1}}$.`,
        `$\\int ${b}\\,dx = ${b}x$.`,
        `Add the constant: $${fmtNice(c1)}x^{${n + 1}} + ${b}x + C$.`,
      ],
    };
  },
};

const definiteIntegral: Generator = {
  id: "int-definite",
  topic: "integrals",
  title: "Definite Integral",
  difficulty: 2,
  generate: () => {
    const a = rnz(1, 4);
    const b = rnz(1, 6);
    const lo = 0;
    const hi = ri(2, 4);
    // ∫₀^hi (a x + b) dx = a/2 hi² + b hi
    const val = (a / 2) * hi * hi + b * hi;
    return {
      promptTex: `\\int_{${lo}}^{${hi}} (${poly([term(a, 1), `${b}`])})\\,dx`,
      lead: "Evaluate the definite integral.",
      inputKind: "number",
      placeholder: "a number",
      check: numCheck(val, 1e-2),
      answerTex: fmtNice(val),
      steps: [
        `Antiderivative: $F(x) = \\dfrac{${a}}{2}x^{2} + ${b}x$.`,
        `Evaluate at the top: $F(${hi}) = ${fmtNice((a / 2) * hi * hi)} + ${b * hi} = ${fmtNice(val)}$.`,
        `At the bottom: $F(0) = 0$.`,
        `By the Fundamental Theorem, the integral is $F(${hi}) - F(0) = ${fmtNice(val)}$.`,
      ],
    };
  },
};

const uSubstitution: Generator = {
  id: "int-usub",
  topic: "integrals",
  title: "u-Substitution",
  difficulty: 3,
  generate: () => {
    const a = rnz(2, 4);
    const n = ri(2, 4);
    // ∫ (ax+1)^n · a dx ... keep simple: ∫ a(ax+1)^? Actually ∫ (ax+b)^n dx
    const b = rnz(1, 5);
    const integrand = `(${a}*x+${b})^${n}`;
    // ∫(ax+b)^n dx = (ax+b)^(n+1) / (a(n+1)) + C
    return {
      promptTex: `\\int (${term(a, 1)}+${b})^{${n}}\\,dx`,
      lead: "Integrate using u-substitution (+ C).",
      inputKind: "expression",
      placeholder: "your antiderivative",
      check: antiderivCheck(integrand),
      answerTex: `\\dfrac{(${term(a, 1)}+${b})^{${n + 1}}}{${a * (n + 1)}} + C`,
      steps: [
        `Let $u = ${term(a, 1)}+${b}$, so $du = ${a}\\,dx \\Rightarrow dx = \\dfrac{du}{${a}}$.`,
        `Rewrite: $\\int u^{${n}}\\cdot \\dfrac{du}{${a}} = \\dfrac{1}{${a}}\\cdot \\dfrac{u^{${n + 1}}}{${n + 1}}$.`,
        `Substitute back: $\\dfrac{(${term(a, 1)}+${b})^{${n + 1}}}{${a * (n + 1)}} + C$.`,
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERIES (BC)
// ─────────────────────────────────────────────────────────────────────────────

const geometricSeries: Generator = {
  id: "series-geometric",
  topic: "series",
  title: "Geometric Series Sum",
  difficulty: 2,
  generate: () => {
    const q = ri(2, 4); // r = 1/q
    const a = ri(1, 6);
    // sum = a / (1 - 1/q) = a·q/(q-1)
    const val = (a * q) / (q - 1);
    return {
      promptTex: `\\sum_{n=0}^{\\infty} ${a}\\left(\\dfrac{1}{${q}}\\right)^{n}`,
      lead: "Find the sum of the geometric series.",
      inputKind: "number",
      placeholder: "a number or fraction",
      check: numCheck(val, 1e-3),
      answerTex: fmtNice(val),
      steps: [
        `Geometric with first term $a = ${a}$ and ratio $r = \\tfrac{1}{${q}}$.`,
        `Since $|r| < 1$, it converges to $\\dfrac{a}{1 - r}$.`,
        `$\\dfrac{${a}}{1 - \\tfrac{1}{${q}}} = \\dfrac{${a}}{\\tfrac{${q - 1}}{${q}}} = ${fmtNice(val)}$.`,
      ],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MULTIVARIABLE (Calc III primer)
// ─────────────────────────────────────────────────────────────────────────────

const partialDeriv: Generator = {
  id: "mv-partial",
  topic: "multivariable",
  title: "Partial Derivative ∂/∂x",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 5);
    const b = rnz(2, 5);
    const c = rnz(1, 5);
    // f(x,y) = a x²y + b x y² + c y ; ∂f/∂x = 2a x y + b y²
    const correctSrc = `${2 * a}*x*y + ${b}*y^2`;
    return {
      promptTex: `f(x,y) = ${a}x^{2}y + ${b}xy^{2} + ${c}y,\\quad \\dfrac{\\partial f}{\\partial x} = \\,?`,
      lead: "Find the partial derivative with respect to x (treat y as constant).",
      inputKind: "expression",
      placeholder: "may contain x and y",
      check: (input) => expressionsEqual(input, correctSrc, { variable: "x", samples: [-1, 0.5, 1.5, 2.5] }) ||
        // also accept by sampling over both vars
        bothVarEqual(input, correctSrc),
      answerTex: `${2 * a}xy + ${b}y^{2}`,
      steps: [
        `Hold $y$ constant and differentiate in $x$.`,
        `$\\frac{\\partial}{\\partial x}(${a}x^{2}y) = ${2 * a}xy$.`,
        `$\\frac{\\partial}{\\partial x}(${b}xy^{2}) = ${b}y^{2}$; the $${c}y$ term has no $x$, so it's 0.`,
        `Result: $${2 * a}xy + ${b}y^{2}$.`,
      ],
    };
  },
};

/** Two-variable equality check by sampling over an (x,y) grid. */
function bothVarEqual(a: string, b: string): boolean {
  try {
    const ca = compile(a);
    const cb = compile(b);
    const xs = [-1.3, 0.4, 1.7];
    const ys = [-0.8, 1.1, 2.2];
    let cnt = 0;
    for (const x of xs)
      for (const y of ys) {
        const va = ca.eval({ x, y });
        const vb = cb.eval({ x, y });
        if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
        if (Math.abs(va - vb) > 1e-6 * Math.max(1, Math.abs(vb))) return false;
        cnt++;
      }
    return cnt > 0;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL GENERATORS (depth pass)
// ─────────────────────────────────────────────────────────────────────────────

const limitDirect: Generator = {
  id: "limit-direct",
  topic: "limits",
  title: "Limit by Direct Substitution",
  difficulty: 1,
  generate: () => {
    const a = rnz(1, 3);
    const b = rnz(-4, 4);
    const c = rnz(-5, 5);
    const k = ri(-3, 3);
    const val = a * k * k + b * k + c;
    const fn = poly([term(a, 2), term(b, 1), `${c}`]);
    return {
      promptTex: `\\lim_{x \\to ${k}} \\left(${fn}\\right)`,
      lead: "Evaluate the limit.",
      inputKind: "number",
      placeholder: "a number",
      check: numCheck(val),
      answerTex: `${val}`,
      steps: [
        `This polynomial is continuous everywhere, so the limit equals the value at $x = ${k}$.`,
        `Substitute $x = ${k}$ into $${fn}$ to get $${val}$.`,
      ],
    };
  },
};

const secondDerivative: Generator = {
  id: "deriv-second",
  topic: "derivatives",
  title: "Second Derivative",
  difficulty: 2,
  generate: () => {
    const a = rnz(1, 4);
    const b = rnz(2, 6);
    const c = rnz(1, 6);
    const d = ri(1, 9);
    const fn = poly([term(a, 3), term(b, 2), term(c, 1), `${d}`]);
    const correctSrc = `${6 * a}*x + ${2 * b}`;
    return {
      promptTex: `f(x) = ${fn} \\quad\\Rightarrow\\quad f''(x) = \\,?`,
      lead: "Find the second derivative.",
      inputKind: "expression",
      placeholder: "e.g. 18x+4",
      check: exprCheck(correctSrc),
      answerTex: poly([term(6 * a, 1), `${2 * b}`]),
      steps: [
        `First derivative (power rule): $f'(x) = ${poly([term(3 * a, 2), term(2 * b, 1), `${c}`])}$.`,
        `Differentiate again: $f''(x) = ${poly([term(6 * a, 1), `${2 * b}`])}$.`,
        `The lower-order terms keep dropping in degree each time you differentiate.`,
      ],
    };
  },
};

const powerRoot: Generator = {
  id: "deriv-root",
  topic: "derivatives",
  title: "Power Rule: Roots & Reciprocals",
  difficulty: 2,
  generate: () => {
    const kind = pick(["sqrt", "recip"] as const);
    if (kind === "sqrt") {
      const a = rnz(2, 6);
      const correctSrc = `${a}/(2*sqrt(x))`;
      return {
        promptTex: `f(x) = ${a}\\sqrt{x}`,
        lead: "Differentiate. (Rewrite the root as a power first.)",
        inputKind: "expression",
        placeholder: "e.g. 3/(2 sqrt(x))",
        check: exprCheck(correctSrc),
        answerTex: `\\dfrac{${a}}{2\\sqrt{x}}`,
        steps: [
          `Rewrite the root as a power: $${a}\\sqrt{x} = ${a}x^{1/2}$.`,
          `Power rule: $\\frac{d}{dx}\\,${a}x^{1/2} = ${a}\\cdot\\tfrac{1}{2}x^{-1/2} = \\dfrac{${a}}{2}x^{-1/2}$.`,
          `Rewrite with a root: $\\dfrac{${a}}{2\\sqrt{x}}$.`,
        ],
      };
    }
    const a = rnz(2, 6);
    const correctSrc = `-${a}/(x^2)`;
    return {
      promptTex: `f(x) = \\dfrac{${a}}{x}`,
      lead: "Differentiate. (Rewrite as a power first.)",
      inputKind: "expression",
      placeholder: "e.g. -3/x^2",
      check: exprCheck(correctSrc),
      answerTex: `-\\dfrac{${a}}{x^{2}}`,
      steps: [
        `Rewrite: $\\dfrac{${a}}{x} = ${a}x^{-1}$.`,
        `Power rule: $\\frac{d}{dx}\\,${a}x^{-1} = -${a}x^{-2}$.`,
        `Rewrite with a positive exponent: $-\\dfrac{${a}}{x^{2}}$.`,
      ],
    };
  },
};

const criticalPoint: Generator = {
  id: "app-critical",
  topic: "applications-deriv",
  title: "Find the Critical Point",
  difficulty: 2,
  generate: () => {
    const a = rnz(1, 3);
    const b = rnz(-6, 6);
    const c = ri(-3, 5);
    const val = -b / (2 * a);
    const fn = poly([term(a, 2), term(b, 1), `${c}`]);
    return {
      promptTex: `f(x) = ${fn}`,
      lead: "Find the x-coordinate of the critical point (where f′(x) = 0).",
      inputKind: "number",
      placeholder: "a number or fraction",
      check: numCheck(val, 1e-2),
      answerTex: fmtNice(val),
      steps: [
        `Differentiate: $f'(x) = ${poly([term(2 * a, 1), `${b}`])}$.`,
        `Set $f'(x) = 0$ and solve: $x = ${fmtNice(val)}$.`,
        `Since the leading coefficient ${a > 0 ? "is positive (parabola opens up)" : "is negative (parabola opens down)"}, this critical point is a ${a > 0 ? "minimum" : "maximum"}.`,
      ],
    };
  },
};

const relatedRates: Generator = {
  id: "app-related-rates",
  topic: "applications-deriv",
  title: "Related Rates (expanding circle)",
  difficulty: 3,
  generate: () => {
    const rate = ri(2, 5);
    const R = ri(3, 8);
    const k = 2 * R * rate;
    return {
      promptTex: `\\frac{dr}{dt} = ${rate}, \\quad r = ${R}`,
      lead: `A circle's radius grows at dr/dt = ${rate}. Find dA/dt when r = ${R}, as a multiple of π — enter just the coefficient.`,
      inputKind: "number",
      placeholder: "the coefficient of π",
      check: numCheck(k, 1e-6),
      answerTex: `${k}\\pi`,
      steps: [
        `Area: $A = \\pi r^2$. Differentiate with respect to time: $\\dfrac{dA}{dt} = 2\\pi r\\,\\dfrac{dr}{dt}$.`,
        `Substitute $r = ${R}$ and $\\dfrac{dr}{dt} = ${rate}$: $\\dfrac{dA}{dt} = 2\\pi(${R})(${rate}) = ${k}\\pi$.`,
        `The coefficient of $\\pi$ is $${k}$.`,
      ],
    };
  },
};

const definiteQuadratic: Generator = {
  id: "int-definite-quad",
  topic: "integrals",
  title: "Definite Integral (quadratic)",
  difficulty: 2,
  generate: () => {
    // Use upper bound 3 so a·x³/3 stays a clean integer.
    const a = rnz(1, 4);
    const b = rnz(1, 6);
    const hi = 3;
    const val = (a / 3) * hi ** 3 + b * hi; // = 9a + 3b
    return {
      promptTex: `\\int_{0}^{${hi}} \\left(${poly([term(a, 2), `${b}`])}\\right) dx`,
      lead: "Evaluate the definite integral.",
      inputKind: "number",
      placeholder: "a number",
      check: numCheck(val, 1e-2),
      answerTex: `${val}`,
      steps: [
        `Antiderivative: $F(x) = \\dfrac{${a}}{3}x^{3} + ${b}x$.`,
        `$F(${hi}) = \\dfrac{${a}}{3}(${hi})^{3} + ${b}(${hi}) = ${9 * a} + ${3 * b} = ${val}$.`,
        `$F(0) = 0$, so the integral equals $${val}$.`,
      ],
    };
  },
};

const averageValue: Generator = {
  id: "int-average",
  topic: "integrals",
  title: "Average Value of a Function",
  difficulty: 2,
  generate: () => {
    const a = rnz(2, 6);
    const hi = ri(2, 4);
    const val = (a * hi) / 2; // average of a·x on [0,hi]
    return {
      promptTex: `f(x) = ${term(a, 1)}, \\quad [0, ${hi}]`,
      lead: "Find the average value of f on the interval.",
      inputKind: "number",
      placeholder: "a number or fraction",
      check: numCheck(val, 1e-2),
      answerTex: fmtNice(val),
      steps: [
        `Average value: $\\bar f = \\dfrac{1}{b-a}\\int_a^b f(x)\\,dx$.`,
        `$\\bar f = \\dfrac{1}{${hi}}\\int_0^{${hi}} ${term(a, 1)}\\,dx = \\dfrac{1}{${hi}}\\cdot \\dfrac{${a}(${hi})^{2}}{2} = ${fmtNice(val)}$.`,
      ],
    };
  },
};

const convergence: Generator = {
  id: "series-converge",
  topic: "series",
  title: "Converge or Diverge?",
  difficulty: 2,
  generate: () => {
    const type = pick([
      "geometric-conv",
      "geometric-div",
      "p-conv",
      "p-div",
      "harmonic",
    ] as const);
    let promptTex = "";
    let converges = false;
    let why = "";
    if (type === "geometric-conv") {
      const q = ri(2, 5);
      promptTex = `\\sum_{n=0}^{\\infty} \\left(\\dfrac{1}{${q}}\\right)^{n}`;
      converges = true;
      why = `Geometric with ratio $r = \\tfrac{1}{${q}}$. Since $|r| < 1$, it converges.`;
    } else if (type === "geometric-div") {
      const r = ri(2, 4);
      promptTex = `\\sum_{n=0}^{\\infty} ${r}^{\\,n}`;
      converges = false;
      why = `Geometric with ratio $r = ${r}$. Since $|r| \\ge 1$, the terms grow and it diverges.`;
    } else if (type === "p-conv") {
      const p = ri(2, 3);
      promptTex = `\\sum_{n=1}^{\\infty} \\dfrac{1}{n^{${p}}}`;
      converges = true;
      why = `A $p$-series with $p = ${p} > 1$, so it converges.`;
    } else if (type === "p-div") {
      promptTex = `\\sum_{n=1}^{\\infty} \\dfrac{1}{\\sqrt{n}}`;
      converges = false;
      why = `A $p$-series with $p = \\tfrac{1}{2} \\le 1$, so it diverges.`;
    } else {
      promptTex = `\\sum_{n=1}^{\\infty} \\dfrac{1}{n}`;
      converges = false;
      why = `The harmonic series — the $p$-series with $p = 1$ — famously diverges (just barely).`;
    }
    return {
      promptTex,
      lead: "Does the series converge or diverge?",
      inputKind: "choice",
      choices: [
        { tex: "\\text{Converges}", correct: converges },
        { tex: "\\text{Diverges}", correct: !converges },
      ],
      answerTex: converges ? "\\text{Converges}" : "\\text{Diverges}",
      steps: [why],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const GENERATORS: Generator[] = [
  limitFactor,
  limitInfinity,
  limitDirect,
  powerRule,
  productRule,
  quotientRule,
  chainRule,
  trigDeriv,
  expLogDeriv,
  secondDerivative,
  powerRoot,
  tangentLine,
  criticalPoint,
  relatedRates,
  indefinitePower,
  definiteIntegral,
  definiteQuadratic,
  averageValue,
  uSubstitution,
  geometricSeries,
  convergence,
  partialDeriv,
];

export function generatorsByTopic(topic: string): Generator[] {
  return GENERATORS.filter((g) => g.topic === topic);
}

export function getGenerator(id: string): Generator | undefined {
  return GENERATORS.find((g) => g.id === id);
}
