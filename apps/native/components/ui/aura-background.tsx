import { Dimensions, View } from "react-native";
import Svg, {
	ClipPath,
	Defs,
	Ellipse,
	FeGaussianBlur,
	Filter,
	G,
	Path,
} from "react-native-svg";
import { twMerge } from "tailwind-merge";
import { useAppTheme } from "@/lib/hooks/use-app-theme";

/** Props for the AuraBackground component */
interface AuraBackgroundProps {
	/**
	 * When true, positions the aura for a top-edge screen overlay.
	 * When false, uses in-content offsets suitable for scroll content.
	 */
	anchorToTopEdge?: boolean;
	/** Additional className for styling */
	className?: string;
}

/** Fixed opacity for the aura ellipse (theme-aware). */
const AURA_OPACITY = { dark: 0.5, light: 0.3 } as const;

/**
 * A reusable background aura component.
 *
 * Renders a blue gradient ellipse with Gaussian blur at the top of the screen.
 * Automatically adapts opacity for light and dark themes.
 *
 * Usage modes:
 * - `anchorToTopEdge={false}` (default): renders as in-content decoration for scroll content.
 * - `anchorToTopEdge={true}`: renders flush to the top edge for absolute overlays.
 *
 * @example
 * ```tsx
 * <TabScreenScrollView
 *   topOverlay={<AuraBackground anchorToTopEdge />}
 *   contentContainerClassName="px-5"
 * >
 *   <View>{content}</View>
 * </TabScreenScrollView>
 * ```
 */
export function AuraBackground({
	anchorToTopEdge = false,
	className,
}: AuraBackgroundProps) {
	const { isDark } = useAppTheme();
	const opacity = isDark ? AURA_OPACITY.dark : AURA_OPACITY.light;
	const { width: screenWidth } = Dimensions.get("window");

	// Scale the SVG to fill the width while maintaining aspect ratio
	const svgWidth = screenWidth;
	const svgHeight = (screenWidth * 402) / 440;

	// In content mode, offset behind the large-title header area.
	const contentHeaderOffset = -116;
	const marginTop = anchorToTopEdge ? 0 : contentHeaderOffset;
	const marginBottom = anchorToTopEdge ? 0 : contentHeaderOffset + 20;

	return (
		<View
			className={twMerge("self-center", className)}
			pointerEvents="none"
			style={{
				width: svgWidth,
				height: svgHeight,
				marginTop,
				marginBottom,
				zIndex: 0,
			}}
		>
			<Svg
				width={svgWidth}
				height={svgHeight}
				viewBox="0 0 440 402"
				preserveAspectRatio="xMidYMin slice"
			>
				<Defs>
					<Filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%">
						<FeGaussianBlur stdDeviation="80" />
					</Filter>
					<ClipPath id="clip0">
						<Path fill="#fff" d="M0 0h440v402H0z" />
					</ClipPath>
				</Defs>
				<G clipPath="url(#clip0)">
					<Ellipse
						cx={220.5}
						cy={96}
						fill="#80AFF5"
						fillOpacity={opacity}
						rx={140}
						ry={170}
						filter="url(#blurFilter)"
					/>
				</G>
			</Svg>
		</View>
	);
}
