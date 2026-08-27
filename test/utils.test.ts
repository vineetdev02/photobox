import { describe, expect, it } from "vitest";

import { countInGroup, deriveGroups, formatTemplate } from "../src/utils.js";
import type { ViewerImage } from "../src/types.js";

const images: ViewerImage[] = [
  { src: "a", group: "Outdoors" },
  { src: "b", group: "Indoors" },
  { src: "c", group: "Outdoors" },
  { src: "d" },
];

describe("deriveGroups", () => {
  it("keeps first-seen order and ignores ungrouped images", () => {
    expect(deriveGroups(images)).toEqual(["Outdoors", "Indoors"]);
  });

  it("returns nothing when no image is grouped", () => {
    expect(deriveGroups([{ src: "a" }, { src: "b" }])).toEqual([]);
  });
});

describe("countInGroup", () => {
  it("counts only exact matches", () => {
    expect(countInGroup(images, "Outdoors")).toBe(2);
    expect(countInGroup(images, "Facilities")).toBe(0);
  });
});

describe("formatTemplate", () => {
  const template = "{group} image {index} of {total} : {title}";

  it("fills every placeholder", () => {
    expect(formatTemplate(template, { group: "Outdoors", index: 1, total: 4, title: "Elevation" })).toBe(
      "Outdoors image 1 of 4 : Elevation",
    );
  });

  it("does not leave punctuation stranded by a missing field", () => {
    expect(formatTemplate(template, { group: undefined, index: 1, total: 4, title: undefined })).toBe(
      "image 1 of 4",
    );
  });

  it("drops a missing group without leaving a double space", () => {
    expect(formatTemplate(template, { index: 2, total: 9, title: "Pool" })).toBe("image 2 of 9 : Pool");
  });

  it("treats zero as a value rather than as missing", () => {
    expect(formatTemplate("{index}/{total}", { index: 0, total: 3 })).toBe("0/3");
  });
});
