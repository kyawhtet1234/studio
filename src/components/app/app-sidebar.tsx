
'use client';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Boxes,
  ArrowRightLeft,
  BarChart3,
  Building2,
  Settings,
  UserCircle,
  LogOut,
  Landmark,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-shiny-blue' },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, color: 'bg-shiny-green' },
  { href: '/products', label: 'Products', icon: Package, color: 'bg-shiny-yellow' },
  { href: '/purchase', label: 'Purchase', icon: Truck, color: 'bg-blue-500' },
  { href: '/inventory', label: 'Inventory', icon: Boxes, color: 'bg-shiny-red' },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'bg-orange-500' },
  { href: '/reports', label: 'Reports', icon: BarChart3, color: 'bg-red-500' },
  { href: '/finance', label: 'Finance', icon: Landmark, color: 'bg-purple-500' },
  { href: '/cash', label: 'Cash', icon: Wallet, color: 'bg-indigo-500' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logOut, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/login');
  };
  
  const isItemActive = (href: string) => {
    if (href === '/') {
        return pathname === '/';
    }
    return pathname.startsWith(href);
  }

  return (
    <Sidebar className="bg-background border-r" side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold font-headline">CloudPOS</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href} className="mb-2">
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={isItemActive(item.href)}
                  tooltip={item.label}
                  className={cn(
                    "w-full justify-start rounded-lg shadow-md transition-transform duration-200 hover:scale-105",
                    item.color,
                    "text-white",
                    isItemActive(item.href) && "ring-2 ring-offset-2 ring-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
         <SidebarMenu>
          <SidebarMenuItem className="mb-2">
             <Link href="/settings" passHref>
                <SidebarMenuButton 
                  as="a" 
                  tooltip="Settings" 
                  isActive={pathname === '/settings'}
                   className={cn(
                    "w-full justify-start rounded-lg shadow-md transition-transform duration-200 hover:scale-105",
                    "bg-purple-600",
                    "text-white",
                    pathname === '/settings' && "ring-2 ring-offset-2 ring-primary"
                  )}
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-auto">
            <SidebarMenuButton tooltip={user?.email || 'Profile'} className="justify-start w-full">
              <UserCircle />
              <span className="truncate text-sm">{user?.email}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout} className="justify-start w-full">
              <LogOut />
              <span className="text-sm">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
