"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enableInteraction = enableInteraction;

var _interaction = require("@pixi/interaction");

var _core = require("../core");

var _mixin = require("./mixin");

function enableInteraction() {
  _core.CanvasRenderer.registerPlugin('interaction', _interaction.InteractionManager);

  _core.WebGLRenderer.registerPlugin('interaction', _interaction.InteractionManager);

  (0, _mixin.mixin)(_core.DisplayObject.prototype, _interaction.interactiveTarget);
}
//# sourceMappingURL=interaction.js.map