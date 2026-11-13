import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

function textFile(content: string, name: string, type: string) {
  const f = new File([content], name, { type });
  // jsdom has no Blob.text(); browsers do.
  if (!f.text) Object.defineProperty(f, "text", { value: async () => content });
  return f;
}

describe("DilemmaPage file upload", () => {
  afterEach(cleanup);

  const upload = (content: string, name = "my-dilemma.md") =>
    fireEvent.change(screen.getByLabelText("Dilemma file"), {
      target: { files: [textFile(content, name, "text/markdown")] }
    });

  it("loads a file into the text box, and Undo restores the earlier text", async () => {
    render(<DilemmaPage initialDilemma="My earlier draft" onSubmit={vi.fn()} />);
    upload("# Should I tell my friend?\n\nShe asked me to keep a secret.");
    const textbox = screen.getByRole("textbox", { name: "Dilemma" });
    await waitFor(() => expect(textbox).toHaveValue("# Should I tell my friend?\n\nShe asked me to keep a secret."));
    expect(screen.getByText(/Loaded “my-dilemma.md”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(textbox).toHaveValue("My earlier draft");
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("loads a dropped file", async () => {
    render(<DilemmaPage initialDilemma="" onSubmit={vi.fn()} />);
    const textbox = screen.getByRole("textbox", { name: "Dilemma" });
    const dropped = textFile("A dropped dilemma about loyalty.", "drop.txt", "text/plain");
    fireEvent.drop(textbox, { dataTransfer: { types: ["Files"], files: [dropped] } });
    await waitFor(() => expect(textbox).toHaveValue("A dropped dilemma about loyalty."));
  });

  it("shows an error and keeps the text when the file is refused", async () => {
    render(<DilemmaPage initialDilemma="Keep me" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Dilemma file"), {
      target: { files: [textFile("not a dilemma", "photo.png", "image/png")] }
    });
    expect(await screen.findByText("Choose a .txt or .md file.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Dilemma" })).toHaveValue("Keep me");
  });

  it("submits the loaded text", async () => {
    const onSubmit = vi.fn();
    render(<DilemmaPage initialDilemma="" onSubmit={onSubmit} />);
    upload("  A loaded dilemma with enough words.  ");
    await screen.findByText(/Loaded/);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmit).toHaveBeenCalledWith("A loaded dilemma with enough words.");
  });
});
