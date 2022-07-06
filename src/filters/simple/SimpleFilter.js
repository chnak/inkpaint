import Filter from "../../renderers/webgl/filters/Filter";
import { readFileSync } from "fs";
import { join } from "path";

export default class SimpleFilter extends Filter {
  constructor(opt) {
    let { key, vert, frag, render, vars } = opt || {};

    if (!render) render = `vec4 render(vec4 rgba, vec2 uv) { return rgba; }`;
    if (!vert) vert = readFileSync(join(__dirname, "../fragments/default.vert"), "utf8");
    if (!frag) {
      const uniforms = [];
      if (vars) {
        for (const [key, val] of Object.entries(vars)) {
          if (!key) continue;
          const type = Array.isArray(val) ? `vec${val.length}` : 'float';
          uniforms.push(`uniform ${type} ${key}`);
        }
      }
      frag = readFileSync(join(__dirname, "./render.frag"), "utf8");
      frag = frag.replace('${uniforms}', uniforms.join("\n")).replace('${render}', render);
    }

    super(vert, frag);
    if (key) this.glShaderKey = key;
    this.vars = vars;
  }

  apply(filterManager, input, output, clear) {
    if (this.uniforms.uFrameSize) {
      this.uniforms.uFrameSize[0] = input.sourceFrame.width;
      this.uniforms.uFrameSize[1] = input.sourceFrame.height;
    }
    super.apply(filterManager, input, output, clear);
  }

  set vars(vars) {
    this._vars = vars;
    if (!vars) return;
    for (const [key, val] of Object.entries(vars)) {
      if (!key) continue;
      this.uniforms[key] = val;
    }
  }

  get vars() {
    return this._vars;
  }
}
