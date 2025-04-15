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

export class Normal extends BaseQuadFilter<RenderParam | null> {
  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  // data가 null일 경우, 텍스쳐 업로드 과정 생략
  draw(data: RenderParam | null, targetTexture: WebGLTexture): void {
    const gl = this.gl;

    this.prepareDraw(targetTexture);

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

    super.draw(data, targetTexture);
  }
}
