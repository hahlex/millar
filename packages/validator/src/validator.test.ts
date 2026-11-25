import { describe, expect, it } from "vitest";
import { validateDesign } from "./index.js";

describe("@hahlex/millar-validator: Deterministic Rules vs. Human Aesthetic Review Split", () => {
  it("forbids CSS gradients in Product UI while permitting explicitly approved Visual Assets in Marketing", () => {
    const productFail = validateDesign({
      register: "product",
      language: "css",
      code: ".card { background: linear-gradient(90deg, #a56b23, #d6b48a); }",
    });
    expect(productFail.automatedChecks.passed).toBe(false);
    expect(productFail.automatedChecks.violations.some((v) => v.ruleId === "millar/gradient-policy")).toBe(true);

    const marketingUnapproved = validateDesign({
      register: "marketing",
      language: "tsx",
      code: '<div style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}>Card</div>',
    });
    expect(marketingUnapproved.automatedChecks.passed).toBe(false);

    const marketingApproved = validateDesign({
      register: "marketing",
      language: "tsx",
      code: '<WarmHorizonWash data-millar-approved-gradient="warm-horizon-wash" style={{ backgroundImage: "radial-gradient(circle, rgba(192,138,74,0.14), transparent)" }}>Hero</WarmHorizonWash>',
    });
    expect(marketingApproved.automatedChecks.violations.some((v) => v.ruleId === "millar/gradient-policy")).toBe(false);

    // Regression guard: mentioning WarmHorizonWash in one section MUST NOT whitelist unrelated gradients elsewhere in the file
    const marketingBypassAttempt = validateDesign({
      register: "marketing",
      language: "tsx",
      code: [
        "<WarmHorizonWash>Hero</WarmHorizonWash>",
        "",
        "",
        '<div style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}>Unapproved card</div>',
      ].join("\n"),
    });
    expect(marketingBypassAttempt.automatedChecks.passed).toBe(false);
    expect(marketingBypassAttempt.automatedChecks.violations.some((v) => v.ruleId === "millar/gradient-policy")).toBe(true);
    expect(marketingBypassAttempt.lifecycleStatus).toBe("draft");
  });

  it("enforces Zero Em-Dash on Hahlex UI copy while NEVER flagging user-data, quotes, or third-party text (Q4)", () => {
    const uiRes = validateDesign({
      register: "product",
      sourceKind: "hahlex-ui",
      code: "<p>Empty cell \u2014 invalid</p>", // em-dash-fixture-ok
    });
    expect(uiRes.automatedChecks.passed).toBe(false);
    expect(uiRes.automatedChecks.violations.some((v) => v.ruleId === "millar/no-em-dash")).toBe(true);

    const quoteRes = validateDesign({
      register: "marketing",
      sourceKind: "quoted-content",
      code: "<blockquote>Customer quote \u2014 preserved verbatim</blockquote>", // em-dash-fixture-ok
    });
    expect(quoteRes.automatedChecks.passed).toBe(true);
    expect(quoteRes.automatedChecks.skippedRules.some((s) => s.ruleId === "millar/no-em-dash")).toBe(true);
  });

  it("catches hallucinated Button variants, missing iconOnly aria-label, dark accent-soft clash, nested footer, and failing contrast pairs", () => {
    const badCode = `
      <main>
        <Button variant="destructive" iconOnly />
        <div className="bg-accent-soft text-fg-accent">Dark toggle bug</div>
        <footer>Wrongly nested</footer>
      </main>
    `;
    const res = validateDesign({
      register: "product",
      language: "tsx",
      code: badCode,
      colorPairs: [{ label: "legacy bronze hover", fg: "#fff8f0", bg: "#c08a4a" }],
    });

    const ids = res.automatedChecks.violations.map((v) => v.ruleId);
    expect(ids).toContain("millar/invalid-button-variant");
    expect(ids).toContain("millar/icon-only-aria-label");
    expect(ids).toContain("millar/no-accent-soft-clash");
    expect(ids).toContain("millar/no-nested-footer");
    expect(ids).toContain("millar/wcag-contrast-pairs");

    // Always keeps human aesthetic review criteria cleanly separate and marked automated: false
    expect(res.humanReviewCriteria.automated).toBe(false);
    expect(res.humanReviewCriteria.criteria.length).toBeGreaterThanOrEqual(4);
  });
});
