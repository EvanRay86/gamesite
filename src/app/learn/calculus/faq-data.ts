// FAQ content, shared between the on-page accordion and the FAQPage JSON-LD in
// page.tsx (so the rich-result data and the visible answers never drift apart).

export interface CalcFAQ {
  question: string;
  answer: string;
}

export const CALC_FAQS: CalcFAQ[] = [
  {
    question: "Is calculus hard to learn?",
    answer:
      "Calculus has a reputation for being hard, but most of the struggle comes from rusty algebra and trigonometry rather than the calculus itself. The core ideas — rates of change and accumulation — are intuitive, especially when you can see them on a graph. Take it one concept at a time, do lots of practice problems, and shore up algebra as you go, and it becomes very approachable.",
  },
  {
    question: "What math do I need before starting calculus?",
    answer:
      "You should be comfortable with algebra (factoring, exponents, solving equations), functions and their graphs, and basic trigonometry (sine, cosine, tangent). You do not need to master everything first — start calculus now and review specific algebra skills whenever a problem trips you up.",
  },
  {
    question: "What is the difference between differential and integral calculus?",
    answer:
      "Differential calculus is about rates of change — the derivative, which is the slope of a curve at a point. Integral calculus is about accumulation — the integral, which is the area under a curve. The Fundamental Theorem of Calculus shows that these two operations are inverses of each other.",
  },
  {
    question: "What is a derivative in simple terms?",
    answer:
      "A derivative measures how fast something is changing at an instant. Geometrically it is the slope of the tangent line to a curve at a single point. If position is a function of time, its derivative is velocity; the speedometer in a car is showing a derivative.",
  },
  {
    question: "What is an integral in simple terms?",
    answer:
      "An integral adds up infinitely many tiny pieces to find a total. The definite integral equals the area under a curve between two points. If you integrate a speed over time, you get the total distance traveled.",
  },
  {
    question: "What does dx actually mean?",
    answer:
      "The dx represents an infinitely small change in x — the width of a vanishingly thin slice. In a derivative dy/dx it indicates you are dividing a tiny change in y by a tiny change in x. In an integral the dx tells you which variable you are summing slices along.",
  },
  {
    question: "How long does it take to learn calculus?",
    answer:
      "A typical first course (Calculus 1, covering limits, derivatives, and basic integrals) takes about a semester, or roughly 60 to 100 hours of focused study. A motivated self-learner can grasp the core ideas in a few weeks, but real fluency comes from consistent practice over a few months.",
  },
  {
    question: "What is the difference between AP Calculus AB and BC?",
    answer:
      "AP Calculus AB covers limits, derivatives, integrals, and their applications — roughly one semester of college calculus. AP Calculus BC includes everything in AB plus additional integration techniques, sequences and series (including Taylor series), and parametric and polar functions — roughly two semesters. BC is faster paced and broader, not necessarily harder concept by concept.",
  },
  {
    question: "Is Calculus 1 the same as differential calculus?",
    answer:
      "Mostly. Calculus 1 centers on limits and differential calculus (derivatives and their applications) and usually introduces basic integration at the end. Calculus 2 focuses on integral calculus, techniques of integration, and series. Calculus 3 covers multivariable calculus.",
  },
  {
    question: "When will I actually use calculus?",
    answer:
      "Calculus underlies physics and engineering (motion, forces, electricity), economics (marginal cost and revenue), medicine (drug dosing), statistics and machine learning (probabilities are integrals; models train via gradient descent, which uses derivatives), biology (population models), and computer graphics. Even if you never compute an integral by hand again, the way of thinking — about rates and accumulation — is broadly useful.",
  },
  {
    question: "What is the best order to learn calculus topics?",
    answer:
      "Start with limits and continuity, then derivatives and differentiation rules, then applications of derivatives (optimization, related rates). Next move to integrals and the Fundamental Theorem, integration techniques, and applications of integration. After that come sequences and series, then multivariable calculus. This page is organized in exactly that order.",
  },
  {
    question: "Do I need a graphing calculator to learn calculus?",
    answer:
      "No. A calculator helps with arithmetic and checking work, but understanding comes from the concepts and graphs. The interactive graphs on this page let you explore visually without any hardware — just drag the sliders and points.",
  },
  {
    question: "What is the Fundamental Theorem of Calculus in plain English?",
    answer:
      "It says differentiation and integration are opposite operations. Part 1: if you build up area under a curve and then take its rate of change, you get the original curve back. Part 2: to find the area under a curve, find an antiderivative, plug in the two endpoints, and subtract. It turns hard area problems into a search for an antiderivative.",
  },
  {
    question: "Why do we need limits in calculus?",
    answer:
      "Limits let us talk precisely about what a function approaches without dividing by zero. A derivative is the limit of an average slope as the gap shrinks to zero; an integral is the limit of a sum of rectangles as they become infinitely thin. Limits are the rigorous foundation that makes both ideas exact rather than approximate.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Per-section FAQs — keyed by the section id used in chapters.ts. Each lesson
// chapter renders its own block via <SectionFaq sectionId="..." />, and every
// entry here is also folded into the page's FAQPage JSON-LD for rich results.
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_FAQS: Record<string, CalcFAQ[]> = {
  intro: [
    {
      question: "Who invented calculus?",
      answer:
        "Calculus was developed independently in the late 1600s by Isaac Newton in England and Gottfried Wilhelm Leibniz in Germany. Newton used it for physics and motion; Leibniz gave us most of the notation we still use today, including the integral sign ∫ and the dy/dx form for derivatives. Their followers feuded bitterly over credit, but both reached the same powerful ideas.",
    },
    {
      question: "Why is it called 'calculus'?",
      answer:
        "The word comes from the Latin 'calculus,' meaning a small pebble — the kind once used on counting boards to do arithmetic. Over time it came to mean any systematic method of calculation. So calculus literally means 'a method of computing,' which fits: it is a toolkit for computing rates of change and accumulated totals.",
    },
    {
      question: "What are the two big ideas of calculus?",
      answer:
        "The derivative and the integral. The derivative measures an instantaneous rate of change (the slope of a curve at a point). The integral measures accumulation (the area under a curve). The Fundamental Theorem of Calculus proves these two operations are inverses of each other — that single connection is what makes calculus so powerful.",
    },
  ],
  prereqs: [
    {
      question: "How good does my algebra need to be for calculus?",
      answer:
        "Solid, but not perfect. You should be able to factor quadratics, simplify fractions, work with exponents and roots, and solve basic equations without much hesitation, because calculus leans on these constantly. The good news: you can start now and patch up specific skills as they come up, rather than reviewing everything first.",
    },
    {
      question: "Do I really need trigonometry?",
      answer:
        "For a first calculus course you mainly need to recognize sine, cosine, and tangent, know the identity sin²θ + cos²θ = 1, and remember a few key values. Trig becomes more important in integration techniques and physics applications. If your trig is rusty, review it alongside calculus rather than treating it as a prerequisite wall.",
    },
    {
      question: "Why do roots and fractions get rewritten as exponents?",
      answer:
        "Because the power rule for derivatives and integrals works on any exponent — including negative and fractional ones. Rewriting √x as x^(1/2) and 1/x³ as x^(-3) lets you apply one rule everywhere instead of memorizing special cases. This single trick removes a huge amount of friction once you get used to it.",
    },
  ],
  limits: [
    {
      question: "What's the difference between a limit and the value of a function?",
      answer:
        "A limit describes where the function is heading as the input approaches a point — it ignores what happens exactly at that point. The function's value is what you get when you plug the point in. They often match (that's continuity), but a function can have a clean limit at a point where it is undefined, like a removable hole.",
    },
    {
      question: "When does a limit fail to exist?",
      answer:
        "A two-sided limit fails to exist when the left and right approaches disagree (a jump), when the function grows without bound (an infinite discontinuity / vertical asymptote), or when it oscillates forever without settling, like sin(1/x) near zero. The key test: both one-sided limits must exist and be equal.",
    },
    {
      question: "What is an indeterminate form like 0/0?",
      answer:
        "It is a signal, not an answer. 0/0 means direct substitution didn't resolve the limit and you need more work — usually factoring, rationalizing, or L'Hôpital's rule. The same applies to ∞/∞ and ∞ − ∞. Crucially, 0/0 is not equal to 0 or 1; the actual limit could be any number, or might not exist at all.",
    },
    {
      question: "How do I evaluate a limit at infinity for a fraction?",
      answer:
        "Compare the degrees of the numerator and denominator. If the bottom's degree is larger, the limit is 0. If the degrees are equal, the limit is the ratio of the leading coefficients. If the top's degree is larger, the function grows without bound (±∞). A quick way to see this is to divide every term by the highest power of x present.",
    },
  ],
  derivatives: [
    {
      question: "What's the difference between average and instantaneous rate of change?",
      answer:
        "Average rate of change is the slope of the secant line between two points — total change divided by total input change. Instantaneous rate of change is the slope at a single point, found by letting the gap between the two points shrink to zero. That limiting slope is the derivative.",
    },
    {
      question: "Is a derivative a number or a function?",
      answer:
        "Both, depending on context. f′(x) is a function — it gives the slope at every x. f′(a) is a number — the slope at the specific point a. When people say 'the derivative,' they usually mean the function f′(x); evaluating it at a point gives a single slope value.",
    },
    {
      question: "What does it mean when the derivative is zero, positive, or negative?",
      answer:
        "A positive derivative means the function is increasing (sloping uphill) there; negative means decreasing (downhill); zero means the tangent line is flat — a possible peak, valley, or plateau. This is why setting f′(x) = 0 is the first step in finding maximums and minimums.",
    },
    {
      question: "Are dy/dx and f′(x) the same thing?",
      answer:
        "Yes — they are two notations for the same derivative. f′(x) (Lagrange notation) is compact; dy/dx (Leibniz notation) names the variables and is handy when you need to track what changes with respect to what, especially in related rates and the chain rule. Use whichever fits the problem.",
    },
  ],
  "deriv-rules": [
    {
      question: "How do I know when to use the chain rule?",
      answer:
        "Use the chain rule whenever a function is wrapped inside another function — a 'function of a function,' like sin(3x), (x²+1)⁵, or e^(2x). The tell-tale sign is that the inside is something more complicated than a bare x. You differentiate the outside, keep the inside, then multiply by the derivative of the inside.",
    },
    {
      question: "Why can't I just differentiate a product term by term?",
      answer:
        "Because the derivative of a product is not the product of the derivatives: (fg)′ ≠ f′g′. The correct rule is (fg)′ = f′g + fg′. Intuitively, when two changing quantities are multiplied, each one's change contributes separately, so you get two terms, not one.",
    },
    {
      question: "What is the single most common differentiation mistake?",
      answer:
        "Forgetting the chain rule's inside derivative. For example, d/dx sin(3x) is 3cos(3x), not cos(3x). Whenever the argument of a function is anything other than a plain x, you must multiply by the derivative of that argument. It is the number-one source of lost points on calculus exams.",
    },
    {
      question: "How do I differentiate something that needs several rules?",
      answer:
        "Work from the outside in, applying one rule at a time. Identify the outermost structure first (is the whole thing a product, a quotient, or a composition?), apply that rule, then differentiate the inner pieces with whatever rules they need. Staying organized — and using parentheses generously — prevents most errors.",
    },
  ],
  "deriv-apps": [
    {
      question: "How do I tell if a critical point is a maximum or a minimum?",
      answer:
        "Two tests. The first-derivative test: if f′ changes from positive to negative at the point, it's a local maximum; negative to positive means a local minimum. The second-derivative test: at a critical point, f″ > 0 means a minimum (concave up, like a cup), and f″ < 0 means a maximum (concave down, like a cap).",
    },
    {
      question: "What's the difference between local and absolute extrema?",
      answer:
        "A local (relative) extremum is the highest or lowest point in its immediate neighborhood. An absolute (global) extremum is the highest or lowest over the entire domain or interval. On a closed interval, absolute extrema occur either at critical points or at the endpoints — so always check the endpoints too.",
    },
    {
      question: "What are related rates problems?",
      answer:
        "They involve two or more quantities that change together over time. You write an equation linking them, differentiate the whole thing with respect to time (using the chain rule), and solve for the rate you want. Classic examples include a growing circle's area, a sliding ladder, or a filling cone.",
    },
    {
      question: "When should I use L'Hôpital's rule?",
      answer:
        "Only for limits that give an indeterminate form of 0/0 or ∞/∞. In those cases you may differentiate the numerator and denominator separately and try the limit again. Do not use it on limits that aren't indeterminate — applying it to something like 3/0 or 5/2 gives wrong answers.",
    },
  ],
  integrals: [
    {
      question: "What's the difference between a definite and an indefinite integral?",
      answer:
        "An indefinite integral is a family of functions (an antiderivative) and always carries a + C; the answer is a function. A definite integral has bounds and evaluates to a single number — the signed area under the curve between those bounds. The Fundamental Theorem connects them: evaluate the antiderivative at the two bounds and subtract.",
    },
    {
      question: "Why do indefinite integrals need a + C?",
      answer:
        "Because the derivative of any constant is zero, infinitely many functions share the same derivative — they differ only by a constant. The + C captures that entire family. On a definite integral you can drop it, because the constant cancels when you subtract F(a) from F(b).",
    },
    {
      question: "Can an integral be negative?",
      answer:
        "Yes. A definite integral measures signed area: regions below the x-axis count as negative. So if a curve dips below the axis, that part subtracts from the total. If you want the actual geometric area (always positive), you integrate the absolute value of the function, splitting at the x-intercepts.",
    },
    {
      question: "What does the Fundamental Theorem of Calculus let me do?",
      answer:
        "It lets you compute exact areas without summing infinitely many rectangles. Instead of evaluating a hard limit of Riemann sums, you find any antiderivative F of your function, then compute F(b) − F(a). It also says that differentiating an accumulated-area function gives back the original function — differentiation and integration undo each other.",
    },
  ],
  "int-techniques": [
    {
      question: "How do I know which integration technique to use?",
      answer:
        "Pattern recognition, which comes with practice. If you see a function and its derivative both present, try u-substitution. If you see a product of two unlike functions (a polynomial times a log or exponential), try integration by parts. For rational functions, try partial fractions. For roots like √(a²−x²), try trig substitution. When stuck, simplify algebraically first.",
    },
    {
      question: "When do I use u-substitution versus integration by parts?",
      answer:
        "Use u-substitution when the integrand contains an inner function together with (a multiple of) its derivative — it reverses the chain rule. Use integration by parts for products where no such pairing exists, like x·eˣ or x·ln(x) — it reverses the product rule. If a u-sub doesn't obviously work on a product, parts is usually the move.",
    },
    {
      question: "What does the LIATE rule mean?",
      answer:
        "LIATE is a guide for choosing 'u' in integration by parts. It ranks function types: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. Whichever appears first in that list becomes u (the part you differentiate); the rest becomes dv (the part you integrate). It works because functions earlier in the list simplify when differentiated.",
    },
    {
      question: "Why can't some functions be integrated?",
      answer:
        "Some functions have no antiderivative expressible with elementary functions. The classic example is e^(−x²), the bell curve — its antiderivative exists but cannot be written using polynomials, roots, exponentials, logs, or trig functions. For these we use numerical integration (like Riemann sums or Simpson's rule) to get accurate values.",
    },
  ],
  "int-apps": [
    {
      question: "How do I set up the area between two curves?",
      answer:
        "Integrate (top curve − bottom curve) over the interval where one stays above the other. First find where they intersect to get the bounds, then make sure you know which function is on top throughout that interval (if they swap, split the integral). The integrand is always the higher minus the lower.",
    },
    {
      question: "When do I use the disk method versus the shell method?",
      answer:
        "Both find volumes of revolution. Use disks (or washers) when slices perpendicular to the axis of rotation give simple circles — the volume element is π·radius²·thickness. Use cylindrical shells when slices parallel to the axis are easier — the element is 2π·radius·height·thickness. Often either works; pick whichever matches the geometry with fewer steps.",
    },
    {
      question: "What is the average value of a function?",
      answer:
        "It's the constant height a rectangle would need to have the same area as the region under the curve over an interval. The formula is (1/(b−a))·∫ f(x) dx from a to b. It's the continuous analog of averaging a list of numbers — instead of summing and dividing, you integrate and divide by the interval length.",
    },
  ],
  series: [
    {
      question: "What does it mean for a series to converge?",
      answer:
        "A series converges if its partial sums (the running totals as you add more terms) approach a finite limit. For example, 1/2 + 1/4 + 1/8 + … converges to 1. If the partial sums grow without bound or never settle, the series diverges. Convergence is about whether adding infinitely many terms gives a sensible finite total.",
    },
    {
      question: "Which convergence test should I use?",
      answer:
        "Start with the nth-term test: if the terms don't approach zero, it diverges immediately. Recognize geometric series (converge iff |r| < 1) and p-series (converge iff p > 1) on sight. Use the ratio test for factorials and powers, and comparison or integral tests when terms resemble a known series. Choosing the right test is a skill that grows with practice.",
    },
    {
      question: "What is a Taylor series actually for?",
      answer:
        "A Taylor series rewrites a complicated function as an infinite polynomial built from its derivatives at a point. This is how calculators and computers evaluate sin, cos, eˣ, and ln — they add up a few polynomial terms, since chips can only add and multiply. Taylor series also let you approximate hard functions and solve problems that have no closed-form answer.",
    },
    {
      question: "What's the difference between a sequence and a series?",
      answer:
        "A sequence is an ordered list of numbers (1, 1/2, 1/3, …). A series is the sum of those numbers (1 + 1/2 + 1/3 + …). A sequence can converge to a limit even when its corresponding series diverges — the harmonic series is the famous example: the terms shrink to zero, yet their sum is infinite.",
    },
  ],
  "parametric-polar": [
    {
      question: "When would I use parametric equations instead of y = f(x)?",
      answer:
        "Use them whenever a curve loops, crosses itself, or fails the vertical-line test — circles, figure-eights, and orbits can't be written as a single y = f(x). Parametric form also naturally describes motion: a parameter t (often time) drives x and y independently, so you capture not just the path but how fast and in which direction it's traced.",
    },
    {
      question: "How do I find the slope dy/dx of a parametric curve?",
      answer:
        "Divide the rates: dy/dx = (dy/dt) / (dx/dt). You differentiate x and y separately with respect to the parameter t, then take their ratio. This comes straight from the chain rule and works as long as dx/dt is not zero (a vertical tangent occurs where dx/dt = 0).",
    },
    {
      question: "What are polar coordinates good for?",
      answer:
        "Polar coordinates locate points by distance r from the origin and angle θ, which is ideal for anything with rotational symmetry: spirals, flower-petal 'rose' curves, cardioids, radar sweeps, and circular motion. Equations that are ugly in x–y, like r = 1 + cos θ, become simple and elegant in polar form.",
    },
  ],
  diffeq: [
    {
      question: "What is a differential equation?",
      answer:
        "It's an equation that relates a function to its own derivatives — so the unknown you're solving for is a whole function, not just a number. For example, y′ = ky says 'the rate of change equals a constant times the amount,' whose solution is exponential growth y = y₀eᵏᵗ. Differential equations model almost every changing system in science.",
    },
    {
      question: "What does it mean for a differential equation to be 'separable'?",
      answer:
        "A first-order equation is separable if you can algebraically get all the y's (and dy) on one side and all the x's (and dx) on the other. Once separated, you integrate both sides independently. It's the most beginner-friendly solution method and handles many of the equations you'll meet first, including exponential and logistic growth.",
    },
    {
      question: "What is a slope field?",
      answer:
        "A slope field is a grid of tiny line segments, each drawn with the slope that the differential equation dictates at that point. It lets you 'see' the family of solutions without solving anything: pick a starting point and follow the segments, and you trace out a solution curve. It's the geometric picture behind Euler's method.",
    },
    {
      question: "Do I always have to solve differential equations by hand?",
      answer:
        "No. Many real-world differential equations have no clean formula solution, so we use numerical methods like Euler's method or Runge–Kutta to approximate solutions step by step. Slope fields give qualitative understanding, analytic methods handle the solvable cases, and numerical methods handle the rest — including most equations in engineering and science.",
    },
  ],
  multivariable: [
    {
      question: "What is a partial derivative?",
      answer:
        "For a function of several variables like f(x, y), a partial derivative measures the slope in just one direction while holding the other variables constant. ∂f/∂x treats y as a fixed number and differentiates in x. Geometrically, it's the slope of the surface as you walk in the x-direction only.",
    },
    {
      question: "What is the gradient?",
      answer:
        "The gradient ∇f bundles all the partial derivatives into a vector. It points in the direction of steepest increase of the function, and its length tells you how steep that climb is. Reversing it gives the direction of steepest decrease — which is exactly what gradient descent follows to train machine-learning models.",
    },
    {
      question: "What is a double integral?",
      answer:
        "A double integral sums a function over a two-dimensional region instead of an interval. Where a single integral adds up thin strips to get area, a double integral adds up tiny columns to get the volume under a surface. You evaluate it as an inner integral followed by an outer one, integrating one variable at a time.",
    },
  ],
};

/** Get the FAQs for a single section (empty array if none). */
export function getSectionFaqs(sectionId: string): CalcFAQ[] {
  return SECTION_FAQS[sectionId] ?? [];
}

/**
 * Every FAQ on the page — the general set plus all per-section sets — for the
 * FAQPage structured data. Deduped by question text.
 */
export function getAllCalcFaqs(): CalcFAQ[] {
  const all = [...CALC_FAQS, ...Object.values(SECTION_FAQS).flat()];
  const seen = new Set<string>();
  return all.filter((f) => {
    const key = f.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
