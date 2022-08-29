import Filter from "../../renderers/webgl/filters/Filter";
import Matrix from "../../math/Matrix";
import Point from "../../math/Point";
import { readFileSync } from "fs";
import { join } from "path";
import { default as TextureMatrix } from "../../textures/TextureMatrix";

export default class TransitionFilter extends Filter {
  constructor(transition) {
    let vert = readFileSync(join(__dirname, "./trans.vert"), "utf8");
    let frag = readFileSync(join(__dirname, "./trans.frag"), "utf8");
    frag = frag.replace('${transitionGlsl}', transition.glsl);
    super(vert, frag);

    this.fromMatrix = new Matrix();
    this.toMatrix = new Matrix();
    this.transition = transition;
  }

  apply(filterManager, input, output) {
    for (const key of ['from', 'to']) {
      const k = `${key}Matrix`;
      this.uniforms[k] = filterManager.calculateSpriteMatrix(this[k], this[`${key}Sprite`]);
    }
    super.apply(filterManager, input, output);
  }

  get prev() {
    return this.fromSprite;
  }

  get next() {
    return this.toSprite;
  }

  set prev(sprite) {
    this.setSprite('from', sprite);
  }

  set next(sprite) {
    this.setSprite('to', sprite);
  }

  get ratio() {
    return this.uniforms.ratio;
  }

  set ratio(ratio) {
    this.uniforms.ratio = ratio;
  }

  set params(params) {
    let unit = 2;
    const { transition, uniforms } = this;
    for (let key in transition.paramsTypes) {
      const value = key in params
        ? params[key]
        : transition.defaultParams[key];
      if (transition.paramsTypes[key] === "sampler2D") {
        if (!value) {
          console.warn(
            "uniform[" +
              key +
              "]: A texture MUST be defined for uniform sampler2D of a texture"
          );
        } else if (typeof value.bind !== "function") {
          throw new Error(
            "uniform[" +
              key +
              "]: A gl-texture2d API-like object was expected"
          );
        } else {
          uniforms[key] = value.bind(unit++);
        }
      } else {
        uniforms[key] = value;
      }
    }
  }

  setSprite(key, sprite) {
    this[`${key}Sprite`] = sprite;
    sprite.renderable = false;
    let tex = sprite.texture;
    if (!tex.transform) {
      // margin = 0.0, let it bleed a bit, shader code becomes easier
      // assuming that atlas textures were made with 1-pixel padding
      tex.transform = new TextureMatrix(tex, 0.0);
    }
    tex.transform.update();
    this.uniforms[`${key}Sampler`] = tex;
    this.uniforms[`${key}ClampFrame`] = tex.transform.uClampFrame;
  }

  updateProgress(progress) {
    this.uniforms.progress = progress;
  }
}
