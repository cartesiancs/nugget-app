function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (shader == null) {
    console.error("셰이더 생성 에러");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("셰이더 컴파일 에러:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export abstract class Filter<TParam> {
  protected program!: WebGLProgram;

  constructor(
    protected gl: WebGLRenderingContext,
    protected vertexShaderSource: string,
    protected fragmentShaderSource: string,
  ) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (vertexShader == null || fragmentShader == null) {
      console.error("셰이더 생성 에러");
      return;
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("R:", gl.getProgramInfoLog(this.program));
      return;
    }
  }

  abstract process(data: TParam, targetTexture: WebGLTexture): void;
}
