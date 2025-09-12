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
} from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/purchase', label: 'Purchase', icon: Truck },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r" side="left" collapsible="icon">
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
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Profile">
              <UserCircle />
              <span>Jane Doe</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
