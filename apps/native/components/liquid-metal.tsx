/**
 * LiquidMetal (safe wrapper)
 *
 * This component exposes the public LiquidMetal API used across the app, but
 * it does **not** import Skia directly at module load time.
 *
 * Why? In Expo (especially Expo Go), native modules may not be present unless
 * you're running a development build. Importing Skia eagerly can crash the
 * screen on navigation. Instead, we lazy-load the Skia implementation and fall
 * back to a simple, non-crashing placeholder.
 */

import React, { useMemo } from 'react';
import { Platform, TurboModuleRegistry, UIManager, View } from 'react-native';

export type LiquidMetalShape = 'filled' | 'none' | 'circle' | 'daisy' | 'diamond' | 'metaballs';

/** Clip path variants for curved panel shapes */
export type LiquidMetalClipPath = 'none' | 'top' | 'bottom';

/** Props for the LiquidMetal component */
export interface LiquidMetalProps {
  /** Width of the canvas */
  width: number;
  /** Height of the canvas */
  height: number;
  /** Background color (hex string) */
  colorBack?: string;
  /** Tint color for color burn blending (hex string) */
  colorTint?: string;
  /** Predefined shape */
  shape?: LiquidMetalShape;
  /** Density of pattern stripes (1 to 10) */
  repetition?: number;
  /** Color transition sharpness, 0 = hard edge, 1 = smooth (0 to 1) */
  softness?: number;
  /** R-channel dispersion (-1 to 1) */
  shiftRed?: number;
  /** B-channel dispersion (-1 to 1) */
  shiftBlue?: number;
  /** Noise distortion over the stripes (0 to 1) */
  distortion?: number;
  /** Strength of distortion on shape edges (0 to 1) */
  contour?: number;
  /** Direction of pattern animation in degrees (0 to 360) */
  angle?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Overall scale of the effect */
  scale?: number;
  /** Border radius for clipping */
  borderRadius?: number;
  /** Clip path for curved panel shapes: 'none' | 'top' | 'bottom' */
  clipPath?: LiquidMetalClipPath;
  /** Stroke color for the curved path border (hex string with optional alpha) */
  strokeColor?: string;
  /** Stroke width for the curved path border */
  strokeWidth?: number;
  /** Custom className for container */
  className?: string;
}

type LiquidMetalImpl = React.ComponentType<LiquidMetalProps>;

let cachedImpl: LiquidMetalImpl | null | undefined;

/**
 * Lazily loads the Skia-backed LiquidMetal implementation.
 * @returns The Skia implementation component, or null if unavailable.
 */
function loadSkiaImpl(): LiquidMetalImpl | null {
  if (cachedImpl !== undefined) return cachedImpl;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./liquid-metal-skia') as {
      LiquidMetal?: LiquidMetalImpl;
      default?: LiquidMetalImpl;
    };
    cachedImpl = mod.LiquidMetal ?? mod.default ?? null;
  } catch (err) {
    console.warn('[LiquidMetal] Skia implementation unavailable. Falling back.', err);
    cachedImpl = null;
  }

  return cachedImpl;
}

/**
 * Checks whether the native Skia view is available in the current runtime.
 * @returns True when Skia's native view manager is registered.
 */
function canUseSkiaRuntime(): boolean {
  // RN Web uses CanvasKit and doesn't rely on a native view manager.
  if (Platform.OS === 'web') return true;

  // Skia's Canvas ultimately renders `SkiaPictureView` natively.
  // In Expo Go (or any build without Skia), this view manager isn't registered.
  if (typeof UIManager.getViewManagerConfig !== 'function') return false;
  if (UIManager.getViewManagerConfig('SkiaPictureView') == null) return false;

  // Skia also requires the TurboModule to be installed.
  if (typeof TurboModuleRegistry.get !== 'function') return true;
  return TurboModuleRegistry.get('RNSkiaModule') != null;
}

/**
 * Non-crashing fallback when Skia isn't available (or fails to initialize).
 * @param props - LiquidMetalProps
 * @returns A plain View placeholder.
 */
function LiquidMetalFallback({
  width,
  height,
  colorBack = '#aaaaac',
  borderRadius = 0,
  className,
}: LiquidMetalProps) {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));

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

/**
 * LiquidMetal
 *
 * Attempts to render the Skia implementation. Falls back gracefully if Skia
 * isn't available in the current runtime.
 */
export function LiquidMetal(props: LiquidMetalProps) {
  const skiaAvailable = useMemo(() => canUseSkiaRuntime(), []);
  const Impl = useMemo(() => (skiaAvailable ? loadSkiaImpl() : null), [skiaAvailable]);
  if (!Impl) return <LiquidMetalFallback {...props} />;
  return <Impl {...props} />;
}

export default LiquidMetal;

