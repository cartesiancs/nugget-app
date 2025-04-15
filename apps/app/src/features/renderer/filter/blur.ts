import { BaseFilter } from "./baseFilter";

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

export class Blur extends BaseFilter<string> {
  positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  positionBuffer: WebGLBuffer | null = null;
  a_position: number;

  texCoordBuffer: WebGLBuffer | null = null;
  texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  a_texCoord: number;

  u_video: WebGLUniformLocation | null;
  u_texelSize: WebGLUniformLocation | null;
  u_blurFactor: WebGLUniformLocation | null;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource);

    this.positionBuffer = gl.createBuffer();
    this.a_position = gl.getAttribLocation(this.program, "a_position");

    this.texCoordBuffer = gl.createBuffer();
    this.a_texCoord = gl.getAttribLocation(this.program, "a_texCoord");

    this.u_video = gl.getUniformLocation(this.program, "u_video");
    this.u_texelSize = gl.getUniformLocation(this.program, "u_texelSize");
    this.u_blurFactor = gl.getUniformLocation(this.program, "u_blurFactor");
  }

  draw(data: string, targetTexture: WebGLTexture): void {
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Quad, 텍스쳐 좌표 바인딩
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.a_position);
      gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.a_texCoord);
      gl.vertexAttribPointer(this.a_texCoord, 2, gl.FLOAT, false, 0, 0);
    }

    // 유니폼 설정
    {
      gl.uniform2fv(this.u_texelSize, [
        1.0 / gl.canvas.width,
        1.0 / gl.canvas.height,
      ]);
      const blurFactor = parseBlurString(data);
      gl.uniform1f(this.u_blurFactor, blurFactor.f);
      gl.uniform1i(this.u_video, 0);
    }

    // 텍스처 바인딩
    {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      gl.uniform1i(this.u_video, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
