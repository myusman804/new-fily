"use client"

import { Tabs } from "expo-router"
import { Text } from "react-native"
import { useTheme } from "@/components/theme-context"
import { LayoutDashboard, DollarSign, User, Upload } from "lucide-react-native"

export default function TabsLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.headerBorder,
        },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textSecondary, fontSize: 12 }}>Overview</Text>
          ),
          tabBarIcon: ({ focused }) => (
            <LayoutDashboard color={focused ? colors.primary : colors.textSecondary} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="earning"
        options={{
          title: "Earnings",
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textSecondary, fontSize: 12 }}>Earnings</Text>
          ),
          tabBarIcon: ({ focused }) => <DollarSign color={focused ? colors.primary : colors.textSecondary} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textSecondary, fontSize: 12 }}>Profile</Text>
          ),
          tabBarIcon: ({ focused }) => <User color={focused ? colors.primary : colors.textSecondary} size={24} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          headerShown: false,
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textSecondary, fontSize: 12 }}>Upload</Text>
          ),
          tabBarIcon: ({ focused }) => <Upload color={focused ? colors.primary : colors.textSecondary} size={24} />,
        }}
      />
    </Tabs>
  )
}
