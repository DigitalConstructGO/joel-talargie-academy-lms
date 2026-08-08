import { SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton } from '@/components/ui/sidebar';

export function SidebarSkeleton({ items = 8 }: { items?: number }) {
  return (
    <SidebarMenu>
      {Array.from({ length: items }, (_, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
