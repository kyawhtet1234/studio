
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
  TrendingUp,
  Settings,
  UserCircle,
  LogOut,
  Landmark,
  Wallet,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, color: 'bg-green-500' },
  { href: '/products', label: 'Products', icon: Package, color: 'bg-yellow-500' },
  { href: '/purchase', label: 'Purchase', icon: Truck, color: 'bg-sky-500' },
  { href: '/inventory', label: 'Inventory', icon: Boxes, color: 'bg-red-500' },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'bg-orange-500' },
  { href: '/reports', label: 'Reports', icon: BarChart3, color: 'bg-rose-500' },
  { href: '/finance', label: 'Finance', icon: Landmark, color: 'bg-purple-500' },
  { href: '/cash', label: 'Cash', icon: Wallet, color: 'bg-indigo-500' },
  { href: '/employees', label: 'Employees', icon: Users, color: 'bg-pink-500' },
];

const CustomLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="none"
    >
        <path
            d="M50,9A41,41,0,1,1,9,50,41,41,0,0,1,50,9m0-8a49,49,0,1,0,49,49A49,49,0,0,0,50,1Z"
            fill="white"
        />
        <path
            d="M58.2,33.4l-4.6,4.6-7-7L35.8,41.8V68.5h8.5V52.8l6.1-6.1,7.1,7.1,11-11V23.5H58.2Z"
            fill="hsl(var(--primary))"
        />
        <path d="M44.2,58.8V68.5h8.5V54.2Z" fill="hsl(var(--primary))" />
        <path d="M52.8,47.2V68.5h8.5V41.8Z" fill="hsl(var(--primary))" />
    </svg>
);


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
        <div className="bg-shiny-orange p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <CustomLogo className="w-8 h-8" />
            <span className="text-xl font-semibold font-headline text-white">THE CRAFT SHOP LEDGER</span>
          </div>
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
                    "w-full justify-start rounded-xl border-2 border-transparent shadow-md transition-transform duration-200 hover:scale-105",
                    item.color,
                    "text-white",
                    isItemActive(item.href) && "ring-4 ring-offset-2 ring-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-base font-medium">{item.label}</span>
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
                    "w-full justify-start rounded-xl border-2 border-transparent shadow-md transition-transform duration-200 hover:scale-105",
                    "bg-purple-600",
                    "text-white",
                    pathname === '/settings' && "ring-4 ring-offset-2 ring-primary"
                  )}
                >
                    <Settings className="h-5 w-5" />
                    <span className="text-base">Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
