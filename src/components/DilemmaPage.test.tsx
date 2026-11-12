import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DilemmaPage } from "./DilemmaPage";

describe("DilemmaPage example search", () => {
  afterEach(cleanup);

  const open = () => {
    render(<DilemmaPage initialDilemma="" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose an example" }));
    return screen.getByRole("group", { name: "Example dilemmas" });
  };

  it("filters the list and lets the user pick a result", () => {
    const list = open();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search examples" }), { target: { value: "omelas" } });
    const options = within(list).getAllByRole("button");
    expect(options).toHaveLength(1);
    fireEvent.click(options[0]);
    expect(screen.getByRole("heading", { name: "The Child Beneath the City" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("says when nothing matches", () => {
    const list = open();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search examples" }), { target: { value: "xylophone" } });
    expect(within(list).queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("No examples match “xylophone”.");
  });

  it("keeps the search after switching to Write my own and back", () => {
    open();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search examples" }), { target: { value: "trolley" } });
    fireEvent.click(screen.getByRole("button", { name: "Write my own" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose an example" }));
    expect(screen.getByRole("searchbox", { name: "Search examples" })).toHaveValue("trolley");
  });

  it("moves from the search box to the first result with the down arrow", () => {
    const list = open();
    const search = screen.getByRole("searchbox", { name: "Search examples" });
    search.focus();
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(document.activeElement).toBe(within(list).getAllByRole("button")[0]);
  });
});
