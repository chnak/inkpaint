varying vec2 vTextureCoord;
varying vec2 vFilterCoord; // for mask

uniform sampler2D uSampler;
uniform sampler2D uMask;

uniform vec4 filterArea;
uniform vec4 filterClamp;

uniform bool useMask;
uniform bool uReverseMask;

${uniforms}

${render}

void main(void) {
  vec4 rgba = texture2D(uSampler, vTextureCoord);
  vec4 color = render(uSampler, vTextureCoord, rgba);
  if (useMask) {
    vec4 mask = texture2D(uMask, vFilterCoord);
    float alpha = dot(mask.rgb, vec3(0.299, 0.587, 0.114)) * mask.a;
    if (uReverseMask) alpha = 1.0 - alpha;
    color = mix(rgba, color * alpha, alpha);
  }
  gl_FragColor = color;
}
