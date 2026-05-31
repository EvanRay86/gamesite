// ─────────────────────────────────────────────────────────────────────────────
// expression.ts — a tiny, safe math-expression parser & evaluator.
//
// No use of eval()/Function(). Expressions are tokenized, converted to RPN via
// the shunting-yard algorithm, and evaluated against a variable scope. Designed
// for two jobs on the Teach Me Calculus page:
//   1. Plotting user/generated functions  → compile() then call many times.
//   2. Checking student answers numerically → sample both expressions & compare.
//
// Supports: + - * / ^, unary minus, parentheses, implicit multiplication
// (e.g. "2x", "3(x+1)", "x(x-1)"), constants (pi, e, tau), and the common
// functions used in single- and multivariable calculus.
// ─────────────────────────────────────────────────────────────────────────────

export type Scope = Record<string, number>;

type TokKind = "num" | "id" | "op" | "lparen" | "rparen" | "comma";
interface Token {
  kind: TokKind;
  value: string;
}

const FUNCTIONS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  csc: (x) => 1 / Math.sin(x),
  sec: (x) => 1 / Math.cos(x),
  cot: (x) => 1 / Math.tan(x),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  arcsin: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log, // natural log by default (calculus convention)
  log10: Math.log10,
  log2: Math.log2,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 4,
  // unary minus handled separately at precedence 3
};

const RIGHT_ASSOC = new Set(["^"]);

// ── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.replace(/\s+/g, "");

  while (i < s.length) {
    const c = s[i];

    // Number (supports decimals and scientific notation like 1.5e-3)
    if (/[0-9.]/.test(c)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      // scientific notation
      if (s[i] === "e" || s[i] === "E") {
        // only treat as exponent if followed by digits or +/- digits
        const ahead = s.slice(i + 1);
        if (/^[+-]?[0-9]/.test(ahead)) {
          num += s[i++]; // e
          if (s[i] === "+" || s[i] === "-") num += s[i++];
          while (i < s.length && /[0-9]/.test(s[i])) num += s[i++];
        }
      }
      tokens.push({ kind: "num", value: num });
      continue;
    }

    // Identifier (function name, variable, or constant)
    if (/[a-zA-Z]/.test(c)) {
      let id = "";
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) id += s[i++];
      tokens.push({ kind: "id", value: id });
      continue;
    }

    if (c === "(") {
      tokens.push({ kind: "lparen", value: c });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen", value: c });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ kind: "comma", value: c });
      i++;
      continue;
    }
    if ("+-*/^".includes(c)) {
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    // Allow ² and × and · as friendly aliases
    if (c === "×" || c === "·") {
      tokens.push({ kind: "op", value: "*" });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${c}" in expression`);
  }

  return insertImplicitMultiplication(tokens);
}

/**
 * Insert explicit "*" where multiplication is implied:
 *   2x → 2*x   3(x) → 3*(x)   )( → )*(   )x → )*x   x(  →  x*(  (var only)
 */
function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = out[out.length - 1];
    if (prev) {
      const prevEndsValue =
        prev.kind === "num" ||
        prev.kind === "rparen" ||
        (prev.kind === "id" && !FUNCTIONS[prev.value]); // var/const, not a function
      const curStartsValue =
        t.kind === "num" ||
        t.kind === "lparen" ||
        t.kind === "id";
      if (prevEndsValue && curStartsValue) {
        out.push({ kind: "op", value: "*" });
      }
    }
    out.push(t);
  }
  return out;
}

// ── Shunting-yard → RPN ──────────────────────────────────────────────────────

type RPNItem =
  | { t: "num"; v: number }
  | { t: "var"; v: string }
  | { t: "op"; v: string }
  | { t: "uminus" }
  | { t: "fn"; v: string; argc: number };

function toRPN(tokens: Token[]): RPNItem[] {
  const output: RPNItem[] = [];
  const ops: (
    | { t: "op"; v: string }
    | { t: "uminus" }
    | { t: "fn"; v: string }
    | { t: "lparen" }
  )[] = [];
  // Track argument counts for function calls
  const argCount: number[] = [];

  let prevKind: TokKind | "start" = "start";

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    switch (tok.kind) {
      case "num":
        output.push({ t: "num", v: parseFloat(tok.value) });
        break;

      case "id": {
        if (FUNCTIONS[tok.value]) {
          ops.push({ t: "fn", v: tok.value });
        } else if (tok.value in CONSTANTS) {
          output.push({ t: "num", v: CONSTANTS[tok.value] });
        } else {
          output.push({ t: "var", v: tok.value });
        }
        break;
      }

      case "op": {
        // Determine unary minus / plus
        const isUnary =
          prevKind === "start" ||
          prevKind === "op" ||
          prevKind === "lparen" ||
          prevKind === "comma";
        if (tok.value === "-" && isUnary) {
          ops.push({ t: "uminus" });
        } else if (tok.value === "+" && isUnary) {
          // unary plus is a no-op; skip
        } else {
          while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.t === "lparen" || top.t === "fn") break;
            const topPrec =
              top.t === "uminus" ? 3 : PRECEDENCE[(top as { v: string }).v];
            const curPrec = PRECEDENCE[tok.value];
            if (
              topPrec > curPrec ||
              (topPrec === curPrec && !RIGHT_ASSOC.has(tok.value))
            ) {
              output.push(ops.pop() as RPNItem);
            } else break;
          }
          ops.push({ t: "op", v: tok.value });
        }
        break;
      }

      case "lparen":
        ops.push({ t: "lparen" });
        // If this paren opens a function call, start arg counter
        if (ops.length >= 2 && ops[ops.length - 2].t === "fn") {
          argCount.push(1);
        }
        break;

      case "comma": {
        while (ops.length && ops[ops.length - 1].t !== "lparen") {
          output.push(ops.pop() as RPNItem);
        }
        if (argCount.length) argCount[argCount.length - 1]++;
        break;
      }

      case "rparen": {
        while (ops.length && ops[ops.length - 1].t !== "lparen") {
          output.push(ops.pop() as RPNItem);
        }
        if (!ops.length) throw new Error("Mismatched parentheses");
        ops.pop(); // remove lparen
        // If a function sits atop the stack, pop it as a call
        const top = ops[ops.length - 1];
        if (top && top.t === "fn") {
          const fn = ops.pop() as { t: "fn"; v: string };
          const argc = argCount.length ? argCount.pop()! : 1;
          output.push({ t: "fn", v: fn.v, argc });
        }
        break;
      }
    }
    prevKind = tok.kind;
  }

  while (ops.length) {
    const top = ops.pop()!;
    if (top.t === "lparen") throw new Error("Mismatched parentheses");
    output.push(top as RPNItem);
  }

  return output;
}

// ── Evaluation ───────────────────────────────────────────────────────────────

function evalRPN(rpn: RPNItem[], scope: Scope): number {
  const stack: number[] = [];
  for (const item of rpn) {
    switch (item.t) {
      case "num":
        stack.push(item.v);
        break;
      case "var": {
        const val = scope[item.v];
        stack.push(val === undefined ? NaN : val);
        break;
      }
      case "uminus":
        stack.push(-(stack.pop() ?? NaN));
        break;
      case "op": {
        const b = stack.pop() ?? NaN;
        const a = stack.pop() ?? NaN;
        switch (item.v) {
          case "+":
            stack.push(a + b);
            break;
          case "-":
            stack.push(a - b);
            break;
          case "*":
            stack.push(a * b);
            break;
          case "/":
            stack.push(a / b);
            break;
          case "^":
            stack.push(Math.pow(a, b));
            break;
        }
        break;
      }
      case "fn": {
        const fn = FUNCTIONS[item.v];
        const args: number[] = [];
        for (let k = 0; k < item.argc; k++) args.unshift(stack.pop() ?? NaN);
        stack.push(fn(...args));
        break;
      }
    }
  }
  return stack.length ? stack[stack.length - 1] : NaN;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface CompiledExpression {
  /** Evaluate against a variable scope, e.g. { x: 2 }. Returns NaN on domain errors. */
  eval: (scope: Scope) => number;
  /** Convenience for single-variable f(x). */
  fn: (x: number) => number;
  /** The variable names referenced (excludes constants/functions). */
  variables: string[];
  /** The original source string. */
  source: string;
}

/**
 * Compile an expression string into a reusable evaluator.
 * Throws on syntax errors so callers can show a friendly message.
 */
export function compile(source: string): CompiledExpression {
  const rpn = toRPN(tokenize(source));
  const variables = Array.from(
    new Set(rpn.filter((r): r is { t: "var"; v: string } => r.t === "var").map((r) => r.v)),
  );
  const evalFn = (scope: Scope) => {
    try {
      return evalRPN(rpn, scope);
    } catch {
      return NaN;
    }
  };
  return {
    eval: evalFn,
    fn: (x: number) => evalFn({ x }),
    variables,
    source,
  };
}

/** Returns true if the string parses into a valid expression. */
export function isValidExpression(source: string): boolean {
  try {
    compile(source);
    return true;
  } catch {
    return false;
  }
}

/**
 * Numerically test whether two single-variable expressions are equivalent by
 * sampling several x-values and comparing. Handles algebraically different but
 * equal forms (e.g. "2(x+1)" vs "2x+2"). Domain errors (NaN) at a sample are
 * treated as "skip that point" unless they disagree about being defined.
 */
export function expressionsEqual(
  a: string,
  b: string,
  opts: { samples?: number[]; tol?: number; variable?: string } = {},
): boolean {
  let ca: CompiledExpression, cb: CompiledExpression;
  try {
    ca = compile(a);
    cb = compile(b);
  } catch {
    return false;
  }
  const variable = opts.variable ?? "x";
  const samples = opts.samples ?? [-2.7, -1.3, -0.5, 0.42, 1.1, 2.3, 3.6, 5.1];
  const tol = opts.tol ?? 1e-6;
  let comparisons = 0;
  for (const x of samples) {
    const va = ca.eval({ [variable]: x });
    const vb = cb.eval({ [variable]: x });
    const aOk = Number.isFinite(va);
    const bOk = Number.isFinite(vb);
    if (!aOk && !bOk) continue; // both undefined here — fine
    if (aOk !== bOk) continue; // one undefined — skip (different domains, be lenient)
    const scale = Math.max(1, Math.abs(va), Math.abs(vb));
    if (Math.abs(va - vb) > tol * scale) return false;
    comparisons++;
  }
  return comparisons > 0;
}
