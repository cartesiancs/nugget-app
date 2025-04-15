import { BaseQuadFilter } from "./baseFilter";

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_video;
  uniform vec2 u_texelSize; 
  uniform float u_blurFactor; 
  varying vec2 v_texCoord;
  void main() {
    vec4 sum = vec4(0.0);
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        vec2 offset = vec2(float(i), float(j)) * u_texelSize * u_blurFactor;
        sum += texture2D(u_video, v_texCoord + offset);
      }
    }
    gl_FragColor = sum / 9.0;
  }
`;

export function parseBlurString(str: string) {
  const parts = str.split(":");

  let f = 0;

  parts.forEach((item) => {
    const [key, value] = item.split("=");
    const numValue = parseInt(value, 10);

    switch (key) {
      case "f":
        f = numValue;
        break;
      default:
        break;
    }
  });

  return { f };
}

export class Blur extends BaseQuadFilter<string> {
  u_texelSize: WebGLUniformLocation | null;
  u_blurFactor: WebGLUniformLocation | null;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource, "u_video");

    this.u_texelSize = gl.getUniformLocation(this.program, "u_texelSize");
    this.u_blurFactor = gl.getUniformLocation(this.program, "u_blurFactor");
  }

  draw(data: string, targetTexture: WebGLTexture): void {
    const gl = this.gl;

    this.prepareDraw(targetTexture);

    gl.uniform2fv(this.u_texelSize, [
      1.0 / gl.canvas.width,
      1.0 / gl.canvas.height,
    ]);
    const blurFactor = parseBlurString(data);
    gl.uniform1f(this.u_blurFactor, blurFactor.f);

    super.draw(data, targetTexture);
  }
}
