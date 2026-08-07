import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";

type Row = { name: string; age: number; notes: string | null };

describe("toCsv", () => {
  it("renders a header row and body rows joined by CRLF", () => {
    const csv = toCsv<Row>(
      [{ name: "Ada", age: 30, notes: null }],
      [
        { key: "name", label: "Name" },
        { key: "age", label: "Age" },
      ],
    );

    expect(csv).toBe("Name,Age\r\nAda,30");
  });

  it("quotes and escapes values containing commas, quotes, or newlines", () => {
    const csv = toCsv<Row>(
      [{ name: 'Ada, "Countess" Lovelace', age: 30, notes: "line1\nline2" }],
      [
        { key: "name", label: "Name" },
        { key: "notes", label: "Notes" },
      ],
    );

    expect(csv).toBe(
      'Name,Notes\r\n"Ada, ""Countess"" Lovelace","line1\nline2"',
    );
  });

  it("uses a column's format function when provided", () => {
    const csv = toCsv<Row>(
      [{ name: "Ada", age: 30, notes: null }],
      [{ key: "age", label: "Age", format: (row) => `${row.age} years` }],
    );

    expect(csv).toBe("Age\r\n30 years");
  });

  it("renders null/undefined values as an empty field", () => {
    const csv = toCsv<Row>(
      [{ name: "Ada", age: 30, notes: null }],
      [{ key: "notes", label: "Notes" }],
    );

    expect(csv).toBe("Notes\r\n");
  });

  it("renders just the header row for an empty dataset", () => {
    const csv = toCsv<Row>([], [{ key: "name", label: "Name" }]);
    expect(csv).toBe("Name");
  });
});

describe("parseCsv", () => {
  it("parses a simple comma-separated grid", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with embedded commas and newlines", () => {
    expect(parseCsv('a,"b, and more","c\nwith a newline"\n1,2,3')).toEqual([
      ["a", "b, and more", "c\nwith a newline"],
      ["1", "2", "3"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('"She said ""hi"""')).toEqual([['She said "hi"']]);
  });

  it("accepts CRLF, LF, and bare CR line endings", () => {
    expect(parseCsv("a,b\r\n1,2\n3,4\r5,6")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
      ["5", "6"],
    ]);
  });

  it("drops fully blank lines but keeps rows with an empty first cell", () => {
    expect(parseCsv("a,b\n\n1,2\n\n,3")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["", "3"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("round-trips values escaped by toCsv", () => {
    const csv = toCsv<Row>(
      [
        { name: 'Quote " comma , newline\nhere', age: 1, notes: null },
        { name: "Plain", age: 2, notes: "fine" },
      ],
      [
        { key: "name", label: "Name" },
        { key: "age", label: "Age", format: (row) => row.age },
        { key: "notes", label: "Notes" },
      ],
    );

    expect(parseCsv(csv)).toEqual([
      ["Name", "Age", "Notes"],
      ['Quote " comma , newline\nhere', "1", ""],
      ["Plain", "2", "fine"],
    ]);
  });
});
