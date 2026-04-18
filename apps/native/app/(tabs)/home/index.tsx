import { Text, View } from "react-native";
import { AuraBackground } from "@/components/ui/aura-background";
import { TabScreenScrollView } from "@/components/ui/tab-screen-view";
import { useTabFocusHaptic } from "@/lib/hooks";

const DashboardSection = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<View className="mb-7">
		<Text className="mb-3 pl-1 font-semibold text-[13px] text-muted uppercase tracking-wider">
			{title}
		</Text>
		{children}
	</View>
);

const DashboardCard = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<View className={`rounded-2xl bg-surface p-5 shadow-sm ${className}`}>
		{children}
	</View>
);

/**
 * Home screen with native iOS large title header.
 *
 * Uses TabScreenScrollView for proper content inset handling with
 * the transparent large title header.
 */
export default function HomeScreen() {
	useTabFocusHaptic();

	return (
		<TabScreenScrollView
			contentContainerClassName="px-5"
			topOverlay={<AuraBackground anchorToTopEdge />}
		>
			{/* Quick Actions Section */}
			<DashboardSection title="Quick Actions">
				<DashboardCard>
					<View className="flex-row items-center">
						<Text className="mr-4 text-4xl">🏠</Text>
						<View className="flex-1">
							<Text className="mb-1 font-semibold text-foreground text-lg">
								Your Space
							</Text>
							<Text className="text-base text-muted leading-5">
								Manage your personal settings and preferences
							</Text>
						</View>
					</View>
				</DashboardCard>
			</DashboardSection>

			{/* Activity Section */}
			<DashboardSection title="Recent Activity">
				<DashboardCard>
					<View className="items-center py-5">
						<Text className="mb-3 text-5xl">📊</Text>
						<Text className="mb-1 font-semibold text-foreground text-lg">
							No recent activity
						</Text>
						<Text className="text-center text-base text-muted">
							Your recent activities will appear here
						</Text>
					</View>
				</DashboardCard>
			</DashboardSection>
		</TabScreenScrollView>
	);
}
