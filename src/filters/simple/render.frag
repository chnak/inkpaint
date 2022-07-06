varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec4 filterArea;
uniform vec4 filterClamp;

${uniforms}

${render}

void main(void) {
  vec4 rgba = texture2D(uSampler, vTextureCoord);
  gl_FragColor = render(rgba, vTextureCoord);
}
