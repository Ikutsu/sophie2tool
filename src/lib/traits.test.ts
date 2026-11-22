/// <reference types="node" />
import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { inheritableTraits, type TraitTable } from "./traits.ts";

const table = JSON.parse(
  readFileSync(new URL("../../public/data/traits.json", import.meta.url), "utf-8"),
) as TraitTable;

// Seen in game (布料, Steam v1.8.0.0): materials carrying 防禦加成+攻擊加成, 速度的祝福,
// 治療燒傷 and 次數壓縮 gave the inherit list 攻防加成 / 速度的祝福 / 治療燒傷 / 次數壓縮.
test("merges a combination pair and keeps the rest in order", () => {
  const list = inheritableTraits([238, 228, 83, 91, 159], table, "mix");
  expect(list.map((t) => table[t.id].name.tc)).toEqual([
    "攻防加成",
    "速度的祝福",
    "治療燒傷",
    "次數壓縮",
  ]);
  expect(list[0].from).toEqual([228, 238]);
});

test("lists a trait once even when two materials carry it", () => {
  expect(inheritableTraits([83, 83], table, "mix").map((t) => t.id)).toEqual([83]);
});

test("merges again when a merged trait has a partner (攻防加成 + 攻速加成 → 全能力加成)", () => {
  const atkSpd = table[276].from![1];
  const list = inheritableTraits([228, 238, atkSpd], table, "mix");
  expect(list.map((t) => t.id)).toEqual([276]);
});

test("marks traits the recipe kind can't take; intermediates take all", () => {
  const limited = Object.entries(table).find(([, t]) => t.kinds && !t.kinds.includes("attack"))!;
  const id = Number(limited[0]);
  expect(inheritableTraits([id], table, "attack")[0].allowed).toBe(false);
  expect(inheritableTraits([id], table, "mix")[0].allowed).toBe(true);
});
