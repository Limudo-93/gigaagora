import { describe, expect, it } from "vitest";
import { generateICS } from "../ics-utils";

describe("ics utils", () => {
  it("generates an ics file with event fields", () => {
    const ics = generateICS([
      {
        title: "Test Gig",
        startTime: "2025-01-01T10:00:00.000Z",
        endTime: "2025-01-01T11:00:00.000Z",
        location: "Test Venue",
        description: "Test description",
      },
    ]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20250101T100000Z");
    expect(ics).toContain("DTEND:20250101T110000Z");
    expect(ics).toContain("SUMMARY:Test Gig");
    expect(ics).toContain("LOCATION:Test Venue");
    expect(ics).toContain("DESCRIPTION:Test description");
    expect(ics).toContain("END:VCALENDAR");
  });
});
