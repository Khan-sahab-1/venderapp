import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OrdersListScreen } from '../screens/OrdersListScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ProductMasterScreen } from '../screens/ProductMasterScreen';
import { UomMasterScreen } from '../screens/UomMasterScreen';
import { CategoryMasterScreen } from '../screens/CategoryMasterScreen';
import { WarehouseMasterScreen } from '../screens/WarehouseMasterScreen';
import { StockLedgerScreen } from '../screens/StockLedgerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const renderDashboardIcon = ({ color }: { color: string }) => (
  <Icon name="home" size={20} color={color} />
);

const renderOrdersIcon = ({ color }: { color: string }) => (
  <Icon name="package" size={20} color={color} />
);

const renderInventoryIcon = ({ color }: { color: string }) => (
  <Icon name="truck" size={20} color={color} />
);

const renderProfileIcon = ({ color }: { color: string }) => (
  <Icon name="user" size={20} color={color} />
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      id="MainTabsNav"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: renderDashboardIcon,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersListScreen}
        options={{
          tabBarLabel: 'Sales Orders',
          tabBarIcon: renderOrdersIcon,
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: renderInventoryIcon,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, mustChangePassword } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStackNav" screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : mustChangePassword ? (
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="ProductMaster" component={ProductMasterScreen} />
            <Stack.Screen name="UomMaster" component={UomMasterScreen} />
            <Stack.Screen name="CategoryMaster" component={CategoryMasterScreen} />
            <Stack.Screen name="WarehouseMaster" component={WarehouseMasterScreen} />
            <Stack.Screen name="StockLedger" component={StockLedgerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

