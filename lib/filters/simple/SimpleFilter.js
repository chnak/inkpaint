"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Filter = _interopRequireDefault(require("../../renderers/webgl/filters/Filter"));

var _path = require("path");

var _Matrix = _interopRequireDefault(require("../../math/Matrix"));

var _TextureMatrix = _interopRequireDefault(require("../../textures/TextureMatrix"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SimpleFilter extends _Filter.default {
  constructor(opt) {
    var {
      key,
      vert,
      frag,
      render,
      vars
    } = opt || {};
    if (!render) render = "vec4 render(sampler2D texture, vec2 uv, vec4 rgba) { return rgba; }";
    if (!vert) vert = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 filterMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vFilterCoord;\n\nvoid main(void)\n{\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vFilterCoord = ( filterMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n   vTextureCoord = aTextureCoord;\n}";

    if (!frag) {
      var uniforms = [];

      if (vars) {
        for (var [_key, val] of Object.entries(vars)) {
          if (!_key) continue;
          var type = Array.isArray(val) ? "vec" + val.length : 'float';
          uniforms.push("uniform " + type + " " + _key + ";");
        }
      }

      frag = "varying vec2 vTextureCoord;\nvarying vec2 vFilterCoord; // for mask\n\nuniform sampler2D uSampler;\nuniform sampler2D uMask;\n\nuniform vec4 filterArea;\nuniform vec4 filterClamp;\n\nuniform bool useMask;\nuniform bool uReverseMask;\n\n${uniforms}\n\n${render}\n\nvoid main(void) {\n  vec4 rgba = texture2D(uSampler, vTextureCoord);\n  vec4 color = render(uSampler, vTextureCoord, rgba);\n  if (useMask) {\n    vec4 mask = texture2D(uMask, vFilterCoord);\n    float alpha = dot(mask.rgb, vec3(0.299, 0.587, 0.114)) * mask.a;\n    if (uReverseMask) alpha = 1.0 - alpha;\n    color = mix(rgba, color * alpha, alpha);\n  }\n  gl_FragColor = color;\n}\n";
      frag = frag.replace('${uniforms}', uniforms.join("\n")).replace('${render}', render);
    }

    super(vert, frag);
    if (key) this.glShaderKey = key;
    this.vars = vars;
    this._maskMatrix = new _Matrix.default();
  }

  apply(filterManager, input, output, clear) {
    if (this.uniforms.uFrameSize) {
      this.uniforms.uFrameSize[0] = input.sourceFrame.width;
      this.uniforms.uFrameSize[1] = input.sourceFrame.height;
    }

    if (this.uniforms.filterMatrix !== undefined && this._mask) {
      this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(this._maskMatrix, this._mask);
    }

    super.apply(filterManager, input, output, clear);
  }

  set vars(vars) {
    this._vars = vars;
    if (!vars) return;

    for (var [key, val] of Object.entries(vars)) {
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
        var tex = mask.texture;

        if (!tex.transform) {
          // margin = 0.0, let it bleed a bit, shader code becomes easier
          // assuming that atlas textures were made with 1-pixel padding
          tex.transform = new _TextureMatrix.default(tex, 0.0);
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

exports.default = SimpleFilter;
//# sourceMappingURL=SimpleFilter.js.map