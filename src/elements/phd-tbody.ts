import { inlineView } from "aurelia-templating";
import {
  BehaviorInstruction,
  processContent,
  ViewCompiler,
  ViewResources
} from "aurelia-framework";

@inlineView("<template><tbody><slot></slot></tbody></template>")
@processContent(
  (
    compiler: ViewCompiler,
    resources: ViewResources,
    $node: Element,
    instruction: BehaviorInstruction
  ): boolean => {
    instruction["factories"] = [];

    instruction["factories"].push(
      compiler.compile(`<template>${$node.innerHTML}</template>`, resources)
    );

    // node.tagName.replace(/-/g, "").toLowerCase() + c + "Factory"
    // $node.parentElement.replaceChild(DOM.createElement("tbody"), $node);

    return false;
  }
)
export class PhdTbodyCustomElement {}
