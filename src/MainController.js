"use strict";

import { canvas, gl } from './GLContext'
import { frameBuffer, rebindRenderBuffer } from './ShadowFrameBuffer'
import { MOVE_VELOCITY, ROT_VELOCITY, flashLight, CameraPara } from './Scene'

export class MainController {

  constructor() {
    this.animateWrap = (timestamp) => this.animate(timestamp);
    this.lastTimestamp = 0;
    this.fpsTime = 0;
    this.fpsCount = 0;

    this.initKeys();

    this.entities = [];
  }

  render() {
    let t = this.camera.getTrans();

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    //this.clear();
    rebindRenderBuffer();
    for (let e of this.entities) {
      e.render(t, true);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.clear();
    for (let e of this.entities) {
      e.render(t, false);
    }
  }

  initKeys() {
    let keyMap = { };
    keyMap['W'.charCodeAt(0)] = 'up';
    keyMap['A'.charCodeAt(0)] = 'left';
    keyMap['S'.charCodeAt(0)] = 'down';
    keyMap['D'.charCodeAt(0)] = 'right';
    keyMap['I'.charCodeAt(0)] = 'upCam';
    keyMap['J'.charCodeAt(0)] = 'leftCam';
    keyMap['K'.charCodeAt(0)] = 'downCam';
    keyMap['L'.charCodeAt(0)] = 'rightCam';
    keyMap['F'.charCodeAt(0)] = 'flashLight';

    this.state = {};
    for (let key in keyMap) {
      if (keyMap.hasOwnProperty(key)) {
        this.state[keyMap[key]] = false;
      }
    }

    window.addEventListener('keydown', (ev) => {
      let key = ev.keyCode;
      if (keyMap.hasOwnProperty(key)) {
        this.state[keyMap[key]] = 1;
      }
    });

    window.addEventListener('keyup', (ev) => {
      let key = ev.keyCode;
      if (keyMap.hasOwnProperty(key)) {
        this.state[keyMap[key]] = 0;
      }
    });
  }

  addEntity(e) {
    this.entities.push(e);
  }

  setCamera(camera) {
    this.camera = camera;
  }

  clear() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }

  startAnimation() {
    window.requestAnimationFrame(this.animateWrap);
  }

  updateFps(timestamp) {
    let t = parseInt(timestamp / 1000)
    if (t != this.fpsTime) {
      CameraPara.fps = this.fpsCount;
      this.camera.updateInfo();
      this.fpsCount = 0;
      this.fpsTime = t;
    }
    ++this.fpsCount;
  }

  animate(timestamp) {
    this.updateFps(timestamp);
    let elapsed = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.camera.move((this.state.up - this.state.down) * MOVE_VELOCITY * elapsed,
                    (this.state.right - this.state.left) * MOVE_VELOCITY * elapsed);
    this.camera.moveCam((this.state.upCam - this.state.downCam) * ROT_VELOCITY * elapsed / 180 * Math.PI,
                        (this.state.rightCam - this.state.leftCam) * ROT_VELOCITY * elapsed / 180 * Math.PI);
    flashLight.enable = this.state.flashLight;

    for (let e of this.entities) {
      if (e.nextFrame) {
        e.nextFrame(elapsed);
      }
    }

    this.render();
    this.startAnimation();
  }
}
