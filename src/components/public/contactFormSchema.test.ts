import { describe, expect, it } from "vitest";
import { createContactFormSchema } from "@/components/public/contactFormSchema";

const schema = createContactFormSchema({ name: "name", email: "email", message: "message" });

describe("public contact form validation", () => {
  it("accepts a valid inquiry and trims submitted values", () => {
    const result = schema.parse({ name: "  Andreas Berger  ", email: " andreas@example.com ", company: " Empria ", service: "Webdesign", message: "  Please contact me about a new website.  " });
    expect(result.name).toBe("Andreas Berger");
    expect(result.email).toBe("andreas@example.com");
    expect(result.message).toBe("Please contact me about a new website.");
  });

  it.each([
    ["empty name", { name: " ", email: "andreas@example.com", company: "", service: "", message: "A valid message here" }],
    ["invalid email", { name: "Andreas", email: "invalid", company: "", service: "", message: "A valid message here" }],
    ["short message", { name: "Andreas", email: "andreas@example.com", company: "", service: "", message: "Too short" }],
  ])("rejects %s", (_label, values) => {
    expect(schema.safeParse(values).success).toBe(false);
  });
});