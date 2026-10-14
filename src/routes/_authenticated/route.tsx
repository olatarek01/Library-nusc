import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await getCurrentUser();
      if (error || !data.user) throw redirect({ to: "/admin/login", reloadDocument: true });
      return { user: data.user };
    } catch (err) {
      if (isRedirect(err)) throw err;
      throw redirect({ to: "/admin/login", reloadDocument: true });
    }
  },
  component: () => <Outlet />,
});
