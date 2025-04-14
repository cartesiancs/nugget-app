import { Filter } from "./common";

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
  uniform vec3 u_keyColor;
  uniform float u_threshold;
  varying vec2 v_texCoord;
  void main() {
    vec4 color = texture2D(u_video, v_texCoord);
    float diff = distance(color.rgb, u_keyColor);
    if(diff < u_threshold) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      gl_FragColor = color;
    }
  }
`;

function parseRGBString(str: string) {
  const parts = str.split(":");

  let r = 0,
    g = 0,
    b = 0,
    f = 1;

  parts.forEach((item) => {
    const [key, value] = item.split("=");
    const numValue = parseFloat(value);

    switch (key) {
      case "r":
        r = numValue;
        break;
      case "g":
        g = numValue;
        break;
      case "b":
        b = numValue;
        break;
      case "f":
        f = numValue;
        break;
      default:
        break;
    }
  });

  return { r, g, b, f };
}

export class ChromaKey extends Filter<string> {
  positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  positionBuffer: WebGLBuffer | null = null;
  a_position: number;

  texCoordBuffer: WebGLBuffer | null = null;
  texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  a_texCoord: number;

  u_video: WebGLUniformLocation | null;
  u_keyColor: WebGLUniformLocation | null;
  u_threshold: WebGLUniformLocation | null;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource);

    this.positionBuffer = gl.createBuffer();
    this.a_position = gl.getAttribLocation(this.program, "a_position");

    this.texCoordBuffer = gl.createBuffer();
    this.a_texCoord = gl.getAttribLocation(this.program, "a_texCoord");

    this.u_video = gl.getUniformLocation(this.program, "u_video");
    this.u_keyColor = gl.getUniformLocation(this.program, "u_keyColor");
    this.u_threshold = gl.getUniformLocation(this.program, "u_threshold");
  }

  process(data: string, targetTexture: WebGLTexture): void {
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
      let keyColor = [0.0, 1.0, 0.0]; // Green
      let ThresholdForce = 0.5;
      const parsedRgb = parseRGBString(data);

      keyColor = [parsedRgb.r / 255, parsedRgb.g / 255, parsedRgb.b / 255];
      ThresholdForce = parsedRgb.f;

      gl.uniform3fv(this.u_keyColor, keyColor);
      gl.uniform1f(this.u_threshold, ThresholdForce);
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
