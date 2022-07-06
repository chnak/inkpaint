"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Filter = _interopRequireDefault(require("../../renderers/webgl/filters/Filter"));

var _path = require("path");

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
    if (!render) render = "vec4 render(vec4 rgba, vec2 uv) { return rgba; }";
    if (!vert) vert = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}";

    if (!frag) {
      var uniforms = [];

      if (vars) {
        for (var [_key, val] of Object.entries(vars)) {
          if (!_key) continue;
          var type = Array.isArray(val) ? "vec" + val.length : 'float';
          uniforms.push("uniform " + type + " " + _key);
        }
      }

      frag = "varying vec2 vTextureCoord;\nuniform sampler2D uSampler;\n\nuniform vec4 filterArea;\nuniform vec4 filterClamp;\n\n${uniforms}\n\n${render}\n\nvoid main(void) {\n  vec4 rgba = texture2D(uSampler, vTextureCoord);\n  gl_FragColor = render(rgba, vTextureCoord);\n}\n";
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

    for (var [key, val] of Object.entries(vars)) {
      if (!key) continue;
      this.uniforms[key] = val;
    }
  }

  get vars() {
    return this._vars;
  }

}

exports.default = SimpleFilter;
//# sourceMappingURL=SimpleFilter.js.map