import { Form, Link, NavLink, Outlet, useNavigation } from "@remix-run/react";
import { Loader } from "lucide-react";
import { useSpinDelay } from "spin-delay";
import { Button } from "~/components/ui/button";
import { useUser } from "~/utils";

export default function SalesPage() {
  const user = useUser();
  const navigation = useNavigation();
  const showSpinner = useSpinDelay(navigation.state !== "idle");

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-3xl font-bold flex items-center justify-center">
          <Link to="/sales/invoices/subscriptions">Invoices</Link>
          {showSpinner ? (
            <Loader className="w-4 h-4 ml-2 mt-2 animate-spin" />
          ) : null}
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <Button type="submit">Logout</Button>
        </Form>
      </header>

      <main className="flex h-full">
        <div className="flex flex-col font-bold text-theme-800">
          <NavItem to="dashboard">Dashboard</NavItem>
          <NavItem to="accounts">Accounts</NavItem>
          <NavItem to="sales">Sales</NavItem>
          <NavItem to="expenses">Expenses</NavItem>
          <NavItem to="reports">Reports</NavItem>
          <a
            href="https://github.com/FrontendMasters/advanced-remix"
            className="my-1 flex gap-1 py-1 px-2 pr-16 text-[length:14px]"
          >
            GitHub
          </a>

          <Form
            method="post"
            action="/logout"
            className="my-1 py-1 px-2 pr-16 text-[length:14px]"
          >
            <Button type="submit">Logout</Button>
          </Form>
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      prefetch="intent"
      className={({ isActive }) =>
        `my-1 py-1 px-2 pr-16 text-[length:14px] ${
          isActive ? "rounded-md bg-theme-400" : ""
        }`
      }
    >
      {children}
    </NavLink>
  );
}
