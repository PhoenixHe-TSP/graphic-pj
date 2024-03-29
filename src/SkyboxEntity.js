"use strict";

import { CameraPara } from './Scene'
import { gl } from './GLContext'
import { ShaderProgram } from './ShaderProgram'

let program = new ShaderProgram([
  { name: 'a_Position', length: 2, size: 2 * Float32Array.BYTES_PER_ELEMENT },
  { name: 'u_CameraUp' },
  { name: 'u_CameraDirection' },
  { name: 'u_CameraNear' }
], `
    attribute vec2 a_Position;
    uniform vec3 u_CameraUp;
    uniform vec3 u_CameraDirection;
    uniform float u_CameraNear;

    varying vec3 v_Position;

    void main() {
      gl_Position = vec4(a_Position, 0.0, 1.0);
      vec3 u_CameraRight = normalize(cross(u_CameraDirection, u_CameraUp));
      v_Position = a_Position[0] * u_CameraRight + a_Position[1] * u_CameraUp + u_CameraNear * u_CameraDirection;
    }
`, [
  { name: 'u_Cubemap' }
], `
    varying vec3 v_Position;
    uniform samplerCube u_Cubemap;

    void main() {
      vec3 dir = normalize(v_Position);
      gl_FragColor = textureCube(u_Cubemap, vec3(-1.0, 1.0, -1.0) * dir);
    }
`);

export class SkyboxEntity {

  constructor(config) {
    this.loadCnt = 0;
    this.loadImg = [];
    this.loadComplete = false;
    this.buffer = gl.createBuffer();
    this.data = new Float32Array([1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0]);

    for (let imgSrc of config) {
      let image = new Image();
      image.onload = () => {
        if (++this.loadCnt < 6) {
          return;
        }

        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let i = 0; i < 6; ++i) {
          gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.loadImg[i]);
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        this.loadComplete = true;
      };
      image.src = imgSrc;
      this.loadImg.push(image);
    }

  }

  render(transform, renderShadow) {
    if (!this.loadComplete || renderShadow) {
      return;
    }

    let p = program.loadProgram(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
    p.loadVaArgs();

    gl.uniform1i(p.args.u_Cubemap, 3);
    gl.uniform3fv(p.args.u_CameraUp, CameraPara.up.elements);
    gl.uniform3fv(p.args.u_CameraDirection, new Vector3(CameraPara.at).minus(CameraPara.eye).elements);
    gl.uniform1f(p.args.u_CameraNear, 1.5);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }
}