
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
  Settings,
  Landmark,
  Wallet,
  Users,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/data-context';
import Image from 'next/image';

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

export function AppSidebar() {
  const pathname = usePathname();
  const { logOut, user } = useAuth();
  const { settings } = useData();
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

  const appName = settings.branding?.appName || "THE CRAFT SHOP LEDGER";
  const appLogo = settings.branding?.appLogo;
  
  // Split app name into two lines if it contains "LEDGER"
  const nameParts = appName.split(' LEDGER');
  const firstLine = nameParts[0];
  const secondLine = nameParts.length > 1 ? 'LEDGER' : '';


  return (
    <Sidebar className="bg-background border-r" side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className={cn("p-4 rounded-xl shadow-[0_8px_16px_rgba(234,179,8,0.4)] border-2 border-black", "bg-shiny-yellow dark:bg-shiny-yellow-dark")}>
          <div className="flex items-center justify-center gap-2">
            {appLogo ? (
                <Image src={appLogo} alt="App Logo" width={32} height={32} className="w-8 h-8" />
            ) : (
                <Building2 className="w-8 h-8 text-black" />
            )}
            <div className="flex flex-col items-center">
                <span className="text-sm font-semibold font-headline text-black leading-tight">{firstLine}</span>
                {secondLine && <span className="text-sm font-semibold font-headline text-black leading-tight">{secondLine}</span>}
            </div>
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
