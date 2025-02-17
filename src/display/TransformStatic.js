import { ObservablePoint } from "../math";
import TransformBase from "./TransformBase";

export default class TransformStatic extends TransformBase {
  constructor() {
    super();

    this.position = new ObservablePoint(this.onChange, this, 0, 0);
    this.scale = new ObservablePoint(this.onChange, this, 1, 1);
    this.pivot = new ObservablePoint(this.onChange, this, 0, 0);
    this.flip = new ObservablePoint(this.onChange, this, 1, 1);
    this.skew = new ObservablePoint(this.updateSkew, this, 0, 0);
    this._rotation = 0;

    this._cx = 1; // cos rotation + skewY;
    this._sx = 0; // sin rotation + skewY;
    this._cy = 0; // cos rotation + Math.PI/2 - skewX;
    this._sy = 1; // sin rotation + Math.PI/2 - skewX;

    this._localID = 0;
    this._currentLocalID = 0;
  }

  onChange() {
    this._localID++;
  }

  updateSkew() {
    this._cx = Math.cos(this._rotation + this.skew._y);
    this._sx = Math.sin(this._rotation + this.skew._y);
    this._cy = -Math.sin(this._rotation - this.skew._x); // cos, added PI/2
    this._sy = Math.cos(this._rotation - this.skew._x); // sin, added PI/2

    this._localID++;
  }

  updateLocalTransform() {
    const lt = this.localTransform;

    if (this._localID !== this._currentLocalID) {
      // get the matrix values of the displayobject based on its transform properties..
      lt.a = this._cx * this.scale._x * this.flip._x;
      lt.b = this._sx * this.scale._x * this.flip._x;
      lt.c = this._cy * this.scale._y * this.flip._y;
      lt.d = this._sy * this.scale._y * this.flip._y;

      lt.tx = this.position._x - (this.pivot._x * lt.a + this.pivot._y * lt.c);
      lt.ty = this.position._y - (this.pivot._x * lt.b + this.pivot._y * lt.d);
      this._currentLocalID = this._localID;

      // force an update..
      this._parentID = -1;
    }
  }

  updateTransform(parentTransform) {
    const lt = this.localTransform;

    if (this._localID !== this._currentLocalID) {
      // get the matrix values of the displayobject based on its transform properties..
      lt.a = this._cx * this.scale._x * this.flip._x;
      lt.b = this._sx * this.scale._x * this.flip._x;
      lt.c = this._cy * this.scale._y * this.flip._y;
      lt.d = this._sy * this.scale._y * this.flip._y;

      lt.tx = this.position._x - (this.pivot._x * lt.a + this.pivot._y * lt.c);
      lt.ty = this.position._y - (this.pivot._x * lt.b + this.pivot._y * lt.d);
      this._currentLocalID = this._localID;

      // force an update..
      this._parentID = -1;
    }

    if (this._parentID !== parentTransform._worldID) {
      // concat the parent matrix with the objects transform.
      const pt = parentTransform.worldTransform;
      const wt = this.worldTransform;

      wt.a = lt.a * pt.a + lt.b * pt.c;
      wt.b = lt.a * pt.b + lt.b * pt.d;
      wt.c = lt.c * pt.a + lt.d * pt.c;
      wt.d = lt.c * pt.b + lt.d * pt.d;
      wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
      wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;

      this._parentID = parentTransform._worldID;

      // update the id of the transform..
      this._worldID++;
    }
  }

  setFromMatrix(matrix) {
    matrix.decompose(this);
    this._localID++;
  }

  get rotation() {
    return this._rotation;
  }

  set rotation(value) {
    if (this._rotation !== value) {
      this._rotation = value;
      this.updateSkew();
    }
  }
}
