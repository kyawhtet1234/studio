
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
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/data-context';
import Image from 'next/image';

const allMenuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, color: 'bg-green-500' },
  { href: '/products', label: 'Products', icon: Package, color: 'bg-yellow-500' },
  { href: '/purchase', label: 'Purchase', icon: Truck, color: 'bg-sky-500' },
  { href: '/inventory', label: 'Inventory', icon: Boxes, color: 'bg-red-500' },
  { href: '/inventory/optimization', label: 'Optimization', icon: BrainCircuit, color: 'bg-orange-500' },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'bg-orange-500' },
  { href: '/reports', label: 'Reports', icon: BarChart3, color: 'bg-rose-500' },
  { href: '/finance', label: 'Finance', icon: Landmark, color: 'bg-purple-500' },
  { href: '/cash', label: 'Cash', icon: Wallet, color: 'bg-indigo-500' },
  { href: '/employees', label: 'Employees', icon: Users, color: 'bg-pink-500' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logOut, user, activeUserRole } = useAuth();
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
    // Make inventory link active for adjustment page as well
    if (href === '/inventory') {
        return pathname.startsWith('/inventory') && !pathname.includes('optimization');
    }
     if (href === '/inventory/optimization') {
        return pathname === '/inventory/optimization';
    }
    if (href === '/products') {
        return pathname.startsWith('/products');
    }
    return pathname.startsWith(href);
  }

  const appName = settings.branding?.appName || "THE CRAFT SHOP LEDGER";
  const appLogo = settings.branding?.appLogo;
  
  const nameParts = appName.split(' LEDGER');
  const firstLine = nameParts[0];
  const secondLine = nameParts.length > 1 ? 'LEDGER' : '';

  const salespersonPermissions = settings.users?.salesperson?.permissions || [];
  const menuItems = activeUserRole === 'salesperson'
    ? allMenuItems.filter(item => salespersonPermissions.includes(item.href))
    : allMenuItems;

  return (
    <Sidebar className="bg-background border-r" side="left" collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-center p-2">
            {appLogo ? (
                <Image src={appLogo} alt="App Logo" width={320} height={320} className="w-40 h-40 object-contain drop-shadow-lg" />
            ) : (
                <Building2 className="w-40 h-40 text-foreground drop-shadow-lg" />
            )}
        </div>
        <div className={cn("p-2 rounded-xl shadow-[0_8px_16px_rgba(234,179,8,0.4)] border-2 border-black", "bg-shiny-yellow dark:bg-shiny-yellow-dark")}>
            <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-semibold font-headline text-black leading-tight text-center">{firstLine}</span>
                {secondLine && <span className="text-sm font-semibold font-headline text-black leading-tight text-center">{secondLine}</span>}
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href} className="mb-2">
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
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
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
         <SidebarMenu>
          {activeUserRole !== 'salesperson' && (
            <SidebarMenuItem className="mb-2">
                <SidebarMenuButton 
                    onClick={() => router.push('/settings')}
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
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
