import Filter from "../../renderers/webgl/filters/Filter";
import { readFileSync } from "fs";
import { join } from "path";
import Matrix from "../../math/Matrix";
import { default as TextureMatrix } from "../../textures/TextureMatrix";

export default class SimpleFilter extends Filter {
  constructor(opt) {
    let { key, vert, frag, render, vars } = opt || {};

    if (!render) render = `vec4 render(sampler2D texture, vec2 uv, vec4 rgba) { return rgba; }`;
    if (!vert) vert = readFileSync(join(__dirname, "../fragments/default-filter-matrix.vert"), "utf8");
    if (!frag) {
      const uniforms = [];
      if (vars) {
        for (const [key, val] of Object.entries(vars)) {
          if (!key) continue;
          const type = Array.isArray(val) ? `vec${val.length}` : 'float';
          uniforms.push(`uniform ${type} ${key};`);
        }
      }
      frag = readFileSync(join(__dirname, "./render.frag"), "utf8");
      frag = frag.replace('${uniforms}', uniforms.join("\n")).replace('${render}', render);
    }

    super(vert, frag);
    if (key) this.glShaderKey = key;
    this.vars = vars;
    this._maskMatrix = new Matrix();
  }

  apply(filterManager, input, output, clear) {
    if (this.uniforms.uFrameSize) {
      this.uniforms.uFrameSize[0] = input.sourceFrame.width;
      this.uniforms.uFrameSize[1] = input.sourceFrame.height;
    }
    if (this.uniforms.filterMatrix !== undefined && this._mask) {
      this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(
        this._maskMatrix, this._mask
      );
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

  get mask() {
    return this._mask;
  }

  set mask(mask) {
    this._mask = mask;
    if (this.uniforms.uMask !== undefined) {
      if (mask) {
        const tex = mask.texture;
        if (!tex.transform) {
          // margin = 0.0, let it bleed a bit, shader code becomes easier
          // assuming that atlas textures were made with 1-pixel padding
          tex.transform = new TextureMatrix(tex, 0.0);
        }
        tex.transform.update();
        this.uniforms.uMask = tex;
        this.uniforms.useMask = true;
        this.uniforms.uReverseMask = !!mask.reverseMask;
        this.uniforms.maskClamp = tex.transform.uClampFrame;
      } else {
        this.uniforms.useMask = false;
      }
    }
  }

}
