import { describe, expect, it } from "vitest";

import {
  ALL_GROUPS,
  clampIndex,
  countInGroup,
  deriveGroups,
  formatTemplate,
  isTypingTarget,
  resolveGroup,
} from "../src/utils.js";
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

describe("isTypingTarget", () => {
  const make = (html: string): HTMLElement => {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    return host.firstElementChild as HTMLElement;
  };

  it("recognises the fields a keystroke belongs to", () => {
    expect(isTypingTarget(make("<input />"))).toBe(true);
    expect(isTypingTarget(make("<textarea></textarea>"))).toBe(true);
    expect(isTypingTarget(make("<select></select>"))).toBe(true);
    expect(isTypingTarget(make('<div contenteditable="true"></div>'))).toBe(true);
  });

  it("looks through a wrapper inside a contenteditable region", () => {
    const editable = make('<div contenteditable="true"><span>text</span></div>');
    expect(isTypingTarget(editable.querySelector("span"))).toBe(true);
  });

  it("leaves everything else to the shortcuts", () => {
    expect(isTypingTarget(make("<button></button>"))).toBe(false);
    expect(isTypingTarget(make('<div contenteditable="false"></div>'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(new EventTarget())).toBe(false);
  });
});

describe("resolveGroup", () => {
  const groups = ["Outdoors", "Indoors"];
  const base = { groups, enabled: true, allTab: false, choice: null } as const;

  it("starts on defaultGroup, then on the first tab, when nothing was chosen", () => {
    expect(resolveGroup({ ...base, defaultGroup: "Indoors" })).toBe("Indoors");
    expect(resolveGroup(base)).toBe("Outdoors");
    expect(resolveGroup({ ...base, allTab: true })).toBeUndefined();
  });

  it("keeps a choice the images still contain", () => {
    expect(resolveGroup({ ...base, choice: "Indoors", defaultGroup: "Outdoors" })).toBe("Indoors");
    expect(resolveGroup({ ...base, allTab: true, choice: ALL_GROUPS })).toBeUndefined();
  });

  it("falls back the same way when the chosen group is gone", () => {
    expect(resolveGroup({ ...base, choice: "Attic" })).toBe("Outdoors");
    expect(resolveGroup({ ...base, choice: "Attic", defaultGroup: "Indoors" })).toBe("Indoors");
  });

  it("does not keep the All tab once there is no All tab", () => {
    expect(resolveGroup({ ...base, choice: ALL_GROUPS })).toBe("Outdoors");
  });

  it("filters nothing when there is no tab bar to choose with", () => {
    expect(resolveGroup({ ...base, enabled: false, choice: "Indoors" })).toBeUndefined();
    expect(resolveGroup({ ...base, groups: ["Indoors"], choice: "Indoors" })).toBeUndefined();
  });

  it("moves to the group of an image asked for by position", () => {
    expect(resolveGroup({ ...base, choice: "Outdoors", requested: { src: "k", group: "Indoors" } })).toBe("Indoors");
    expect(resolveGroup({ ...base, choice: "Indoors", requested: { src: "k", group: "Indoors" } })).toBe("Indoors");
  });

  it("stays on the All tab, which already shows every image", () => {
    expect(
      resolveGroup({ ...base, allTab: true, choice: ALL_GROUPS, requested: { src: "k", group: "Indoors" } }),
    ).toBeUndefined();
  });

  it("shows everything for an image that belongs to no tab", () => {
    expect(resolveGroup({ ...base, requested: { src: "plan" } })).toBeUndefined();
  });
});

describe("clampIndex", () => {
  it("keeps a position inside the set", () => {
    expect(clampIndex(2, 4)).toBe(2);
    expect(clampIndex(9, 4)).toBe(3);
    expect(clampIndex(-1, 4)).toBe(0);
  });

  it("never returns something that is not a usable index", () => {
    expect(clampIndex(Number.NaN, 4)).toBe(0);
    expect(clampIndex(1.7, 4)).toBe(1);
    expect(clampIndex(3, 0)).toBe(0);
  });
});
