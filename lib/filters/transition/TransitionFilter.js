"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Filter = _interopRequireDefault(require("../../renderers/webgl/filters/Filter"));

var _Matrix = _interopRequireDefault(require("../../math/Matrix"));

var _Point = _interopRequireDefault(require("../../math/Point"));

var _path = require("path");

var _TextureMatrix = _interopRequireDefault(require("../../textures/TextureMatrix"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TransitionFilter extends _Filter.default {
  constructor(transition) {
    var vert = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 _uv;\n\nvoid main(void) {\n  //  gl_Position = vec4(_p,0.0,1.0);\n  //  _uv = vec2(0.5, 0.5) * (_p+vec2(1.0, 1.0));\n  vec2 _p = (projectionMatrix * vec3(aVertexPosition, 1.0)).xy;\n  gl_Position = vec4(_p, 0.0, 1.0);\n  vTextureCoord = aTextureCoord;\n  _uv = vec2(0.5, 0.5) * (_p+vec2(1.0, 1.0));\n}";
    var frag = "precision highp float;\n\nvarying vec2 _uv;\n\nuniform float progress;\nuniform float ratio;\n\nuniform sampler2D fromSampler;\nuniform sampler2D toSampler;\n\nuniform vec4 fromClampFrame;\nuniform vec4 toClampFrame;\n\nuniform mat3 fromMatrix;\nuniform mat3 toMatrix;\n\nvec4 getColor(sampler2D tex, vec2 uv, vec4 frame) {\n  vec4 rgba = texture2D(tex, uv);\n  rgba *= step(3.5,\n      step(frame.x, uv.x) +\n      step(frame.y, uv.y) +\n      step(uv.x, frame.z) +\n      step(uv.y, frame.w));\n  return rgba;\n}\n\nvec4 getFromColor(vec2 uv) {\n  return texture2D(fromSampler, vec2(uv.x, 1.0 - uv.y));\n  //return getColor(fromSampler, (fromMatrix * vec3(uv, 1.0)).xy, fromClampFrame);\n}\n\nvec4 getToColor(vec2 uv) {\n  return texture2D(toSampler, vec2(uv.x, 1.0 - uv.y));\n  //return getColor(toSampler, (toMatrix * vec3(uv, 1.0)).xy, toClampFrame);\n}\n\n${transitionGlsl}\n\nvoid main(void) {\n  gl_FragColor = transition(_uv);\n  //gl_FragColor = mix(getFromColor(vTextureCoord), getToColor(vTextureCoord), progress);\n}\n"; // todo: extractUniformsFromString写的比较烂，需要过滤掉注释

    var glsl = transition.glsl;
    var lines = [];

    for (var line of glsl.split("\n")) {
      line = line.trim();
      if (line.startsWith('//')) continue;

      if (line.startsWith('uniform ')) {
        var words = [];

        for (var word of line.replace(/\s+/g, ' ').split(" ")) {
          if (word.startsWith('//')) break;
          words.push(word);
        }

        lines.push(words.join(' '));
      } else {
        lines.push(line);
      }
    }

    glsl = lines.join("\n");
    frag = frag.replace('${transitionGlsl}', glsl);
    super(vert, frag);
    this.fromMatrix = new _Matrix.default();
    this.toMatrix = new _Matrix.default();
    this.transition = transition;
  }

  apply(filterManager, input, output) {
    for (var key of ['from', 'to']) {
      var k = key + "Matrix";
      this.uniforms[k] = filterManager.calculateSpriteMatrix(this[k], this[key + "Sprite"]);
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
    var unit = 2;
    var {
      transition,
      uniforms
    } = this;

    for (var key in transition.paramsTypes) {
      var value = key in params ? params[key] : transition.defaultParams[key];

      if (transition.paramsTypes[key] === "sampler2D") {
        if (!value) {
          console.warn("uniform[" + key + "]: A texture MUST be defined for uniform sampler2D of a texture");
        } else if (typeof value.bind !== "function") {
          throw new Error("uniform[" + key + "]: A gl-texture2d API-like object was expected");
        } else {
          uniforms[key] = value.bind(unit++);
        }
      } else {
        uniforms[key] = value;
      }
    }
  }

  setSprite(key, sprite) {
    this[key + "Sprite"] = sprite;
    sprite.renderable = false;
    var tex = sprite.texture;

    if (!tex.transform) {
      // margin = 0.0, let it bleed a bit, shader code becomes easier
      // assuming that atlas textures were made with 1-pixel padding
      tex.transform = new _TextureMatrix.default(tex, 0.0);
    }

    tex.transform.update();
    this.uniforms[key + "Sampler"] = tex;
    this.uniforms[key + "ClampFrame"] = tex.transform.uClampFrame;
  }

  updateProgress(progress) {
    this.uniforms.progress = progress;
  }

}

exports.default = TransitionFilter;
//# sourceMappingURL=TransitionFilter.js.map