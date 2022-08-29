precision highp float;

varying vec2 _uv;

uniform float progress;
uniform float ratio;

uniform sampler2D fromSampler;
uniform sampler2D toSampler;

uniform vec4 fromClampFrame;
uniform vec4 toClampFrame;

uniform mat3 fromMatrix;
uniform mat3 toMatrix;

vec4 getColor(sampler2D tex, vec2 uv, vec4 frame) {
  vec4 rgba = texture2D(tex, uv);
  rgba *= step(3.5,
      step(frame.x, uv.x) +
      step(frame.y, uv.y) +
      step(uv.x, frame.z) +
      step(uv.y, frame.w));
  return rgba;
}

vec4 getFromColor(vec2 uv) {
  return texture2D(fromSampler, vec2(uv.x, 1.0 - uv.y));
  //return getColor(fromSampler, (fromMatrix * vec3(uv, 1.0)).xy, fromClampFrame);
}

vec4 getToColor(vec2 uv) {
  return texture2D(toSampler, vec2(uv.x, 1.0 - uv.y));
  //return getColor(toSampler, (toMatrix * vec3(uv, 1.0)).xy, toClampFrame);
}

${transitionGlsl}

void main(void) {
  gl_FragColor = transition(_uv);
  //gl_FragColor = mix(getFromColor(vTextureCoord), getToColor(vTextureCoord), progress);
}
