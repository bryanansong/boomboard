import React from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import LeafPng from "@/assets/content/membership-card-leaf.png";

const BRAND_COLOR = "#D23A23";

interface MembershipCardProps {
	name: string;
	title: string;
	joinDate: string;
}

function DiagonalStripes() {
	const width = 26;
	const height = 26;
	const strokeWidth = 2;
	const spacing = 4;
	const numLines = Math.ceil((width + height) / spacing) + 1;

	return (
		<View style={{ width, height, overflow: "hidden" }}>
			<Svg width={width} height={height}>
				{[...Array(numLines)].map((_, i) => {
					const startX = i * spacing - height;
					const endX = i * spacing;
					return (
						<Line
							key={`stripe-${i}`}
							x1={startX}
							y1={height}
							x2={endX}
							y2={0}
							stroke={BRAND_COLOR}
							strokeWidth={strokeWidth}
						/>
					);
				})}
			</Svg>
		</View>
	);
}

export function MembershipCard({ name, title, joinDate }: MembershipCardProps) {
	return (
		<View
			className="w-[300px] items-center rounded-2xl bg-[#FDFBF5] p-4"
			style={{
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.12,
				shadowRadius: 24,
				elevation: 8,
			}}
		>
			<Image
				source={LeafPng}
				className="mb-4"
				contentFit="contain"
				style={{ width: 268, height: 268 }}
				accessibilityLabel="Membership Card Leaf"
			/>

			<View className="mt-5 w-full px-1">
				<Text
					className="font-bold text-[32px] leading-9 tracking-tight"
					style={{ color: BRAND_COLOR }}
				>
					{name}
				</Text>
				<Text
					className="mt-1 font-medium text-sm tracking-[1.5px] opacity-90"
					style={{ color: BRAND_COLOR }}
				>
					{title}
				</Text>
			</View>

			<View className="mt-4 w-full flex-row items-center justify-between px-1">
				<View
					className="h-7 flex-row items-center overflow-hidden rounded-md border-[1.5px]"
					style={{ borderColor: BRAND_COLOR }}
				>
					<View className="h-full justify-center px-2">
						<Text className="font-bold text-xs" style={{ color: BRAND_COLOR }}>
							SINCE
						</Text>
					</View>
					<DiagonalStripes />
					<View className="h-full justify-center px-2">
						<Text
							className="font-medium text-xs"
							style={{ color: BRAND_COLOR }}
						>
							{joinDate}
						</Text>
					</View>
				</View>

				<View className="items-end">
					<Text
						className="font-black text-[11px] tracking-wide"
						style={{ color: BRAND_COLOR }}
					>
						EXCLUSIVE
					</Text>
					<Text
						className="font-black text-[11px] tracking-wide"
						style={{ color: BRAND_COLOR }}
					>
						ACCESS
					</Text>
				</View>
			</View>
		</View>
	);
}

export default MembershipCard;
