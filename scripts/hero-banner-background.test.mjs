import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create } from "react-test-renderer";
import ts from "typescript";

test("hero waits for each image and ignores loads after replacement or unmount", async (t) => {
  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  t.after(() => {
    if (previousActEnvironment === undefined)
      delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    else globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });
  const images = [];
  class Image {
    onload = null;
    constructor() {
      images.push(this);
    }
  }
  const exports = {};
  const code = ts.transpileModule(
    readFileSync(
      new URL(
        "../src/components/landing/hero-banner-background.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  runInNewContext(code, {
    exports,
    Image,
    require(name) {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsxRuntime;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = (src) =>
    React.createElement(exports.HeroBannerBackground, {
      src,
      alt: "Hero photo",
    });
  let root;
  await act(async () => {
    root = create(render("first.jpg"));
  });
  t.after(async () => {
    await act(async () => root.unmount());
  });
  const background = () => root.root.findByProps({ role: "img" });
  assert.match(background().props.className, /opacity-0/);
  await act(async () => images[0].onload());
  assert.match(background().props.className, /opacity-100/);

  await act(async () => root.update(render("second.jpg")));
  assert.equal(images[0].onload, null);
  assert.match(background().props.className, /opacity-0/);
  await act(async () => root.update(render("third.jpg")));
  assert.equal(images[1].onload, null);
  assert.match(background().props.className, /opacity-0/);
  await act(async () => images[2].onload());
  assert.match(background().props.className, /opacity-100/);
  assert.equal(background().props.style.backgroundImage, "url(third.jpg)");

  await act(async () => root.unmount());
  assert.equal(images[2].onload, null);
});
