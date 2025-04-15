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
  uniform sampler2D u_sampler;
  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_sampler, v_texCoord);
  }
`;

type RenderParam = {
  source: TexImageSource;
  flipY?: boolean;
};

export class Normal extends BaseFilter<RenderParam | null> {
  positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  positionBuffer: WebGLBuffer | null = null;
  a_position: number;

  texCoordBuffer: WebGLBuffer | null = null;
  texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  a_texCoord: number;

  u_sampler: WebGLUniformLocation | null;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource);

    this.positionBuffer = this.gl.createBuffer();
    this.a_position = this.gl.getAttribLocation(this.program, "a_position");

    this.texCoordBuffer = this.gl.createBuffer();
    this.a_texCoord = this.gl.getAttribLocation(this.program, "a_texCoord");

    this.u_sampler = this.gl.getUniformLocation(this.program, "u_sampler");
  }

  // data가 null일 경우, targetTexture를 바로 렌더링
  draw(data: RenderParam | null, targetTexture: WebGLTexture): void {
    const gl = this.gl;

    gl.useProgram(this.program);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Quad 좌표 바인딩
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.a_position);
      gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
    }

    // 텍스처 좌표 바인딩
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.a_texCoord);
      gl.vertexAttribPointer(this.a_texCoord, 2, gl.FLOAT, false, 0, 0);
    }

    // 텍스처 바인딩
    {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      gl.uniform1i(this.u_sampler, 0);
    }

    // 텍스처 데이터 전달
    if (data != null) {
      if (data.flipY) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data.source,
      );
      if (data.flipY) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      }
    }

    // 렌더링
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
