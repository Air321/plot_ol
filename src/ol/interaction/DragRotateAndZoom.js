/**
 * @module ol/interaction/DragRotateAndZoom
 */
import {shiftKeyOnly, mouseOnly} from '../events/condition.js';
import PointerInteraction from './Pointer.js';


/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition~shiftKeyOnly}.
 * @property {number} [duration=400] Animation duration in milliseconds.
 */


/**
 * @classdesc
 * Allows the user to zoom and rotate the map by clicking and dragging
 * on the map.  By default, this interaction is limited to when the shift
 * key is held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * And this interaction is not included in the default interactions.
 * @api
 */
class DragRotateAndZoom extends PointerInteraction {

  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super(/** @type {import("./Pointer.js").Options} */ (options));

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : shiftKeyOnly;

    /**
     * @private
     * @type {number|undefined}
     */
    this.lastAngle_ = undefined;

    /**
     * @private
     * @type {number|undefined}
     */
    this.lastMagnitude_ = undefined;

    /**
     * @private
     * @type {number}
     */
    this.lastScaleDelta_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.duration_ = options.duration !== undefined ? options.duration : 400;

  }

  /**
   * @inheritDoc
   */
  handleDragEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return;
    }

    const map = mapBrowserEvent.map;
    const size = map.getSize();
    const offset = mapBrowserEvent.pixel;
    const deltaX = offset[0] - size[0] / 2;
    const deltaY = size[1] / 2 - offset[1];
    const theta = Math.atan2(deltaY, deltaX);
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const view = map.getView();
    if (this.lastAngle_ !== undefined) {
      const angleDelta = this.lastAngle_ - theta;
      view.adjustRotation(angleDelta);
    }
    this.lastAngle_ = theta;
    if (this.lastMagnitude_ !== undefined) {
      view.adjustResolution(this.lastMagnitude_ / magnitude);
    }
    if (this.lastMagnitude_ !== undefined) {
      this.lastScaleDelta_ = this.lastMagnitude_ / magnitude;
    }
    this.lastMagnitude_ = magnitude;
  }

  /**
   * @inheritDoc
   */
  handleUpEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return true;
    }

    const map = mapBrowserEvent.map;
    const view = map.getView();
    const direction = this.lastScaleDelta_ > 1 ? 1 : -1;
    view.endInteraction(this.duration_, direction);
    this.lastScaleDelta_ = 0;
    return false;
  }

  /**
   * @inheritDoc
   */
  handleDownEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return false;
    }

    if (this.condition_(mapBrowserEvent)) {
      mapBrowserEvent.map.getView().beginInteraction();
      this.lastAngle_ = undefined;
      this.lastMagnitude_ = undefined;
      return true;
    } else {
      return false;
    }
  }
}

export default DragRotateAndZoom;
