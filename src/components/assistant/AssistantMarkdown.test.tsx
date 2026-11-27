import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssistantMarkdown } from "./AssistantMarkdown";

describe("AssistantMarkdown", () => {
  it("renders a markdown table as a real table", () => {
    const { container } = render(<AssistantMarkdown content={"| Client | Owed |\n| --- | --- |\n| Dr. Weber | €399,99 |"} />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelectorAll("td")[1].textContent).toBe("€399,99");
  });
});
