
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

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/purchase', label: 'Purchase', icon: Truck },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/finance', label: 'Finance', icon: Landmark },
  { href: '/cash', label: 'Cash', icon: Wallet },
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
    <Sidebar className="bg-sidebar-shiny-gradient shadow-lg" side="left" collapsible="icon" variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Building2 className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold font-headline">CloudPOS</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={isItemActive(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/settings" passHref>
                <SidebarMenuButton as="a" tooltip="Settings" isActive={pathname === '/settings'}>
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={user?.email || 'Profile'}>
              <UserCircle />
              <span>{user?.email}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
