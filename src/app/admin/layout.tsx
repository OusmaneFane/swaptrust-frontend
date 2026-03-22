import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGate } from '@/components/admin/AdminGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminLayout>{children}</AdminLayout>
    </AdminGate>
  );
}
