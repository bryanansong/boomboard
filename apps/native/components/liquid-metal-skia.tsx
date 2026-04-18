/**
 * LiquidMetal (Skia)
 *
 * Skia RuntimeEffect-based implementation of Paper's "Liquid Metal" shader.
 *
 * This file is intentionally separated from `liquid-metal.tsx` so that the
 * wrapper can gracefully fall back when Skia isn't available (e.g. Expo Go
 * without a dev build).
 *
 * Original reference:
 * - https://shaders.paper.design/liquid-metal
 * - https://github.com/paper-design/shaders/blob/b17bc1f115247713e9f0e893147305ace11be7bc/packages/shaders/src/shaders/liquid-metal.ts
 */

import {
  Canvas,
  Fill,
  Group,
  Path,
  processUniforms,
  Shader,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import type { LiquidMetalProps } from './liquid-metal';

/** Shape to numeric value mapping */
const SHAPE_VALUES = {
  filled: -1, // No edge gradient, for use with external clip paths
  none: 0,
  circle: 1,
  daisy: 2,
  diamond: 3,
  metaballs: 4,
} as const;

/**
 * Converts hex color to RGBA array (0-1 range)
 * @param hex - Hex color string (e.g., '#ffffff' or '#fff')
 * @returns Array of [r, g, b, a] values between 0-1
 */
function hexToRgba(hex: string): [number, number, number, number] {
  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;
  const a = fullHex.length === 8 ? parseInt(fullHex.slice(6, 8), 16) / 255 : 1;

  return [r, g, b, a];
}

/**
 * Creates a Skia path for curved panel clipping
 * @param variant - 'top' for concave bottom curve, 'bottom' for convex top curve
 * @param width - Panel width
 * @param height - Panel height
 * @param borderRadius - Corner radius
 * @param curveHeight - Height of the curve bulge
 * @returns Skia Path object
 */
function makeClipPath(
  variant: 'top' | 'bottom',
  width: number,
  height: number,
  borderRadius: number,
  curveHeight: number = 40,
) {
  const path = Skia.Path.Make();
  const r = borderRadius;

  if (variant === 'top') {
    // Top panel: rounded top corners, concave curve at bottom (bulging upward)
    // Start at top-left after the corner radius
    path.moveTo(r, 0);
    // Top edge
    path.lineTo(width - r, 0);
    // Top-right corner
    path.quadTo(width, 0, width, r);
    // Right edge down to bottom
    path.lineTo(width, height);
    // Bottom edge with concave curve (curves UPWARD into the panel)
    // Control point is at center, pulled UP by curveHeight
    path.quadTo(width * 0.5, height - curveHeight, 0, height);
    // Left edge up to the corner
    path.lineTo(0, r);
    // Top-left corner
    path.quadTo(0, 0, r, 0);
    path.close();
  } else {
    // Bottom panel: convex curve at top (bulging upward), rounded bottom corners
    const topCurveHeight = curveHeight * 0.75;
    // Start at top-left at the curve start height
    path.moveTo(0, topCurveHeight);
    // Top edge with convex curve (arcs UPWARD)
    // Control point is at center, pulled UP beyond the edge
    path.quadTo(width * 0.5, -topCurveHeight * 0.5, width, topCurveHeight);
    // Right edge down to bottom corner
    path.lineTo(width, height - r);
    // Bottom-right corner
    path.quadTo(width, height, width - r, height);
    // Bottom edge
    path.lineTo(r, height);
    // Bottom-left corner
    path.quadTo(0, height, 0, height - r);
    // Left edge up to curve start
    path.lineTo(0, topCurveHeight);
    path.close();
  }

  return path;
}

/**
 * SkSL shader source adapted from Paper Shaders' LiquidMetal GLSL.
 *
 * We use an inlined SkSL RuntimeEffect to keep the component portable across
 * Expo + native and avoid bundling extra shader assets.
 */
const LIQUID_METAL_SHADER_SOURCE = `
  uniform float2 u_resolution;
  uniform float u_time;
  uniform float4 u_colorBack;
  uniform float4 u_colorTint;
  uniform float u_softness;
  uniform float u_repetition;
  uniform float u_shiftRed;
  uniform float u_shiftBlue;
  uniform float u_distortion;
  uniform float u_contour;
  uniform float u_angle;
  uniform float u_shape;
  uniform float u_scale;

  const float PI = 3.14159265359;

  // 2D rotation matrix
  float2 rotate(float2 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return float2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  // Simplex noise implementation
  float3 mod289(float3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  float2 mod289_2(float2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  float3 permute(float3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(float2 v) {
    const float4 C = float4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
    float2 i = floor(v + dot(v, C.yy));
    float2 x0 = v - i + dot(i, C.xx);
    float2 i1 = (x0.x > x0.y) ? float2(1.0, 0.0) : float2(0.0, 1.0);
    float4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_2(i);
    float3 p = permute(permute(i.y + float3(0.0, i1.y, 1.0)) + i.x + float3(0.0, i1.x, 1.0));
    float3 m = max(0.5 - float3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    float3 x = 2.0 * fract(p * C.www) - 1.0;
    float3 h = abs(x) - 0.5;
    float3 ox = floor(x + 0.5);
    float3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    float3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Color changes function for stripe pattern transitions
  float getColorChanges(float c1, float c2, float stripe_p, float3 w, float blur, float bump, float tint) {
    float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripe_p));
    
    float border = w.x;
    ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe_p));
    
    float bumpSmooth = smoothstep(0.2, 0.8, bump);
    border = w.x + 0.4 * (1.0 - bumpSmooth) * w.y;
    ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe_p));
    
    border = w.x + 0.5 * (1.0 - bumpSmooth) * w.y;
    ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe_p));
    
    border = w.x + w.y;
    ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe_p));
    
    float gradient_t = (stripe_p - w.x - w.y) / w.z;
    float gradient = mix(c1, c2, smoothstep(0.0, 1.0, gradient_t));
    ch = mix(ch, gradient, smoothstep(border, border + 0.5 * blur, stripe_p));
    
    // Color burn blending with tint
    ch = mix(ch, 1.0 - min(1.0, (1.0 - ch) / max(tint, 0.0001)), u_colorTint.a);
    return ch;
  }

  half4 main(float2 pos) {
    float t = 0.3 * u_time;
    
    // Normalize UV to 0-1 range and apply scale
    float2 uv = pos / u_resolution;
    float safeScale = max(u_scale, 0.01);
    uv = (uv - 0.5) / safeScale + 0.5;
    
    float cycleWidth = u_repetition;
    float edge = 0.0;
    
    // Apply rotation for stripe direction
    float2 rotatedUV = uv - float2(0.5);
    float angle = (-u_angle + 70.0) * PI / 180.0;
    rotatedUV = rotate(rotatedUV, angle) + float2(0.5);
    
    // Shape generation
    // u_shape < 0 = filled (no edge, for use with external clip paths)
    // u_shape < 1 = none (edge gradient from borders)
    // u_shape < 2 = circle, etc.
    if (u_shape < 0.0) {
      // Filled mode - no edge gradient, 100% fill
      // Use this when clipping is handled externally (e.g., Skia clip path)
      edge = 0.0;
      cycleWidth *= 2.0;
    } else if (u_shape < 1.0) {
      // Full fill - edge gradient from borders
      float2 mask = min(uv, 1.0 - uv);
      float maskX = smoothstep(0.0, 0.15, mask.x);
      float maskY = smoothstep(0.0, 0.15, mask.y);
      maskX = pow(maskX, 0.25);
      maskY = pow(maskY, 0.25);
      edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
      cycleWidth *= 2.0;
    } else if (u_shape < 2.0) {
      // Circle
      float2 shapeUV = uv - 0.5;
      shapeUV *= 0.67;
      edge = pow(clamp(3.0 * length(shapeUV), 0.0, 1.0), 18.0);
    } else if (u_shape < 3.0) {
      // Daisy
      float2 shapeUV = uv - 0.5;
      shapeUV *= 1.68;
      float r = length(shapeUV) * 2.0;
      float a = atan(shapeUV.y, shapeUV.x) + 0.2;
      r *= (1.0 + 0.05 * sin(3.0 * a + 2.0 * t));
      float f = abs(cos(a * 3.0));
      edge = smoothstep(f, f + 0.7, r);
      edge *= edge;
      cycleWidth *= 1.6;
    } else if (u_shape < 4.0) {
      // Diamond
      float2 shapeUV = uv - 0.5;
      shapeUV = rotate(shapeUV, 0.25 * PI);
      shapeUV *= 1.42;
      shapeUV += 0.5;
      float2 mask = min(shapeUV, 1.0 - shapeUV);
      float2 pixel_thickness = float2(0.15);
      float maskX = smoothstep(0.0, pixel_thickness.x, mask.x);
      float maskY = smoothstep(0.0, pixel_thickness.y, mask.y);
      maskX = pow(maskX, 0.25);
      maskY = pow(maskY, 0.25);
      edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
    } else {
      // Metaballs
      float2 shapeUV = uv - 0.5;
      shapeUV *= 1.3;
      edge = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float speed = 1.5 + 0.667 * sin(fi * 12.345);
        float angleM = -fi * 1.5;
        float2 dir1 = float2(cos(angleM), sin(angleM));
        float2 dir2 = float2(cos(angleM + 1.57), sin(angleM + 1.0));
        float2 traj = 0.4 * (dir1 * sin(t * speed + fi * 1.23) + dir2 * cos(t * (speed * 0.7) + fi * 2.17));
        float d = length(shapeUV + traj);
        edge += pow(1.0 - clamp(d, 0.0, 1.0), 4.0);
      }
      edge = 1.0 - smoothstep(0.65, 0.9, edge);
      edge = pow(edge, 4.0);
    }
    
    // Apply contour to edge (avoid undefined smoothstep(0.9, 0.9, edge))
    float hardEdge = smoothstep(0.9, 0.90001, edge);
    edge = mix(hardEdge, edge, smoothstep(0.0, 0.4, u_contour));
    
    // Calculate opacity based on shape
    float opacity = 1.0 - hardEdge;
    if (u_shape < 2.0) {
      edge = 1.2 * edge;
    } else if (u_shape < 5.0) {
      edge = 1.8 * pow(edge, 1.5);
    }
    
    // Calculate direction for stripe pattern
    float diagBLtoTR = rotatedUV.x - rotatedUV.y;
    float diagTLtoBR = rotatedUV.x + rotatedUV.y;
    
    float3 color1 = float3(0.98, 0.98, 1.0);
    float3 color2 = float3(0.1, 0.1, 0.1 + 0.1 * smoothstep(0.7, 1.3, diagTLtoBR));
    
    float2 grad_uv = uv - 0.5;
    float dist = length(grad_uv + float2(0.0, 0.2 * diagBLtoTR));
    grad_uv = rotate(grad_uv, (0.25 - 0.2 * diagBLtoTR) * PI);
    float direction = grad_uv.x;
    
    float bump = pow(1.8 * dist, 1.2);
    bump = 1.0 - bump;
    bump *= pow(uv.y, 0.3);
    
    // Calculate stripe widths
    float thin_strip_1_ratio = 0.12 / cycleWidth * (1.0 - 0.4 * bump);
    float thin_strip_2_ratio = 0.07 / cycleWidth * (1.0 + 0.4 * bump);
    float wide_strip_ratio = 1.0 - thin_strip_1_ratio - thin_strip_2_ratio;
    
    float thin_strip_1_width = cycleWidth * thin_strip_1_ratio;
    float thin_strip_2_width = cycleWidth * thin_strip_2_ratio;
    
    // Add noise for organic movement
    float noise = snoise(uv - t);
    edge += (1.0 - edge) * u_distortion * noise;
    
    // Apply direction modifications
    direction += diagBLtoTR;
    direction -= 2.0 * noise * diagBLtoTR * (smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge)));
    direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, u_contour));
    direction -= 1.7 * edge * smoothstep(0.5, 1.0, u_contour);
    direction += 0.2 * pow(u_contour, 4.0) * (1.0 - smoothstep(0.0, 1.0, edge));
    
    bump *= clamp(pow(uv.y, 0.1), 0.3, 1.0);
    direction *= (0.1 + (1.1 - edge) * bump);
    direction *= (0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge)));
    direction += 0.18 * (smoothstep(0.1, 0.2, uv.y) * (1.0 - smoothstep(0.2, 0.4, uv.y)));
    direction += 0.03 * (smoothstep(0.1, 0.2, 1.0 - uv.y) * (1.0 - smoothstep(0.2, 0.4, 1.0 - uv.y)));
    
    direction *= (0.5 + 0.5 * pow(uv.y, 2.0));
    direction *= cycleWidth;
    direction -= t;
    
    // Calculate color dispersion for chromatic aberration
    float colorDispersion = 1.0 - bump;
    colorDispersion = clamp(colorDispersion, 0.0, 1.0);
    
    float dispersionRed = colorDispersion;
    dispersionRed += 0.03 * bump * noise;
    dispersionRed += 5.0 * (smoothstep(-0.1, 0.2, uv.y) * (1.0 - smoothstep(0.1, 0.5, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 1.0, bump)));
    dispersionRed -= diagBLtoTR;
    
    float dispersionBlue = colorDispersion;
    dispersionBlue *= 1.3;
    dispersionBlue += (smoothstep(0.0, 0.4, uv.y) * (1.0 - smoothstep(0.1, 0.8, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 0.8, bump)));
    dispersionBlue -= 0.2 * edge;
    
    dispersionRed *= u_shiftRed / 20.0;
    dispersionBlue *= u_shiftBlue / 20.0;
    
    float blur = u_softness / 15.0;
    
    float3 w = float3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w.y -= 0.02 * smoothstep(0.0, 1.0, edge + bump);
    
    // Calculate RGB channels with dispersion
    float stripe_r = fract(direction + dispersionRed);
    float r = getColorChanges(color1.r, color2.r, stripe_r, w, blur, bump, u_colorTint.r);
    
    float stripe_g = fract(direction);
    float g = getColorChanges(color1.g, color2.g, stripe_g, w, blur, bump, u_colorTint.g);
    
    float stripe_b = fract(direction - dispersionBlue);
    float b = getColorChanges(color1.b, color2.b, stripe_b, w, blur, bump, u_colorTint.b);
    
    float3 color = float3(r, g, b);
    color *= opacity;
    
    // Blend with background
    float3 bgColor = u_colorBack.rgb * u_colorBack.a;
    color = color + bgColor * (1.0 - opacity);
    opacity = opacity + u_colorBack.a * (1.0 - opacity);
    
    return half4(color, opacity);
  }
`;

/**
 * LiquidMetal - Animated liquid metal shader effect
 *
 * Renders a premium liquid metal effect using GPU shaders.
 * Adapts the Paper Shaders LiquidMetal effect for React Native.
 */
export function LiquidMetal({
  width,
  height,
  colorBack = '#aaaaac',
  colorTint = '#ffffff',
  shape = 'diamond',
  repetition = 2,
  softness = 0.1,
  shiftRed = 0.3,
  shiftBlue = 0.3,
  distortion = 0.07,
  contour = 0.4,
  angle = 70,
  speed = 1,
  scale = 0.6,
  borderRadius = 0,
  clipPath = 'none',
  strokeColor,
  strokeWidth = 0,
  className,
}: LiquidMetalProps) {
  const clock = useClock();

  // Clamp inputs to safe ranges so uniforms never contain invalid values.
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const safeRepetition = Math.min(10, Math.max(1, repetition));
  const safeSoftness = Math.min(1, Math.max(0, softness));
  const safeShiftRed = Math.min(1, Math.max(-1, shiftRed));
  const safeShiftBlue = Math.min(1, Math.max(-1, shiftBlue));
  const safeDistortion = Math.min(1, Math.max(0, distortion));
  const safeContour = Math.min(1, Math.max(0, contour));
  const safeAngle = ((angle % 360) + 360) % 360;
  const safeSpeed = Math.max(0, speed);
  const safeScale = Math.max(0.01, scale);

  // Compile shader inside component to ensure Skia is initialized
  // useMemo ensures this only happens once per component instance
  const shaderSource = useMemo(() => {
    const effect = Skia.RuntimeEffect.Make(LIQUID_METAL_SHADER_SOURCE);
    if (!effect) {
      console.error('Failed to compile LiquidMetal shader');
    }
    return effect;
  }, []);

  // Parse colors
  const colorBackRgba = useMemo(() => hexToRgba(colorBack), [colorBack]);
  const colorTintRgba = useMemo(() => hexToRgba(colorTint), [colorTint]);

  // Get shape value
  const shapeValue = SHAPE_VALUES[shape];

  // Create clip path for curved panel shapes
  const curvedClipPath = useMemo(() => {
    if (clipPath === 'none') return null;
    return makeClipPath(clipPath, safeWidth, safeHeight, 12, 40);
  }, [clipPath, safeWidth, safeHeight]);

  /**
   * Preflight the runtime shader once per prop-set.
   *
   * Some platforms/dev builds can crash if a RuntimeEffect compiles but cannot
   * create a shader at draw time (e.g., missing uniforms or backend limitations).
   * We proactively validate and fall back instead of hard-crashing the screen.
   */
  const isShaderUsable = useMemo(() => {
    if (!shaderSource) return false;

    try {
      const testUniforms = {
        u_resolution: [safeWidth, safeHeight],
        u_time: 0,
        u_colorBack: colorBackRgba,
        u_colorTint: colorTintRgba,
        u_softness: safeSoftness,
        u_repetition: safeRepetition,
        u_shiftRed: safeShiftRed,
        u_shiftBlue: safeShiftBlue,
        u_distortion: safeDistortion,
        u_contour: safeContour,
        u_angle: safeAngle,
        u_shape: shapeValue,
        u_scale: safeScale,
      } as const;

      // Throws if any uniform is missing.
      const uniformArray = processUniforms(shaderSource, testUniforms);

      // Throws on unsupported backends. We don't need to keep the returned shader.
      shaderSource.makeShader(uniformArray);

      return true;
    } catch (err) {
      console.error('[LiquidMetal] Runtime shader preflight failed', err);
      return false;
    }
  }, [
    shaderSource,
    safeWidth,
    safeHeight,
    colorBackRgba,
    colorTintRgba,
    safeSoftness,
    safeRepetition,
    safeShiftRed,
    safeShiftBlue,
    safeDistortion,
    safeContour,
    safeAngle,
    shapeValue,
    safeScale,
  ]);

  // Build uniforms using useDerivedValue for proper animation support
  const uniforms = useDerivedValue(() => ({
    u_resolution: [safeWidth, safeHeight],
    u_time: clock.value * safeSpeed * 0.001, // Convert ms to seconds with speed
    u_colorBack: colorBackRgba,
    u_colorTint: colorTintRgba,
    u_softness: safeSoftness,
    u_repetition: safeRepetition,
    u_shiftRed: safeShiftRed,
    u_shiftBlue: safeShiftBlue,
    u_distortion: safeDistortion,
    u_contour: safeContour,
    u_angle: safeAngle,
    u_shape: shapeValue,
    u_scale: safeScale,
  }));

  // Don't render if shader failed to compile / initialize safely
  if (!shaderSource || !isShaderUsable) {
    return (
      <View
        className={className}
        style={{
          width: safeWidth,
          height: safeHeight,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: colorBack,
        }}
      />
    );
  }

  // Render the shader content - either clipped or not
  const shaderContent = (
    <Fill>
      <Shader source={shaderSource} uniforms={uniforms} />
    </Fill>
  );

  // Check if we should render a stroke
  const shouldRenderStroke = curvedClipPath && strokeColor && strokeWidth > 0;

  return (
    <View
      className={className}
      style={{
        width: safeWidth,
        height: safeHeight,
        // Only use borderRadius if no custom clip path
        borderRadius: curvedClipPath ? 0 : borderRadius,
        overflow: 'hidden',
      }}
    >
      <Canvas style={{ width: safeWidth, height: safeHeight }}>
        {curvedClipPath ? (
          <>
            <Group clip={curvedClipPath}>{shaderContent}</Group>
            {shouldRenderStroke && (
              <Path
                path={curvedClipPath}
                color={strokeColor}
                style="stroke"
                strokeWidth={strokeWidth}
              />
            )}
          </>
        ) : (
          shaderContent
        )}
      </Canvas>
    </View>
  );
}

export default LiquidMetal;

