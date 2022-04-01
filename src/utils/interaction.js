import { InteractionManager, interactiveTarget } from '@pixi/interaction';
import { WebGLRenderer, CanvasRenderer, DisplayObject } from '../core';
import { mixin } from './mixin';

export function enableInteraction() {
  CanvasRenderer.registerPlugin('interaction', InteractionManager);
  WebGLRenderer.registerPlugin('interaction', InteractionManager);
  mixin(DisplayObject.prototype, interactiveTarget);
}