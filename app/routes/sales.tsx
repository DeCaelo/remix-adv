import { Form, Link, NavLink, Outlet } from "@remix-run/react";
import { useUser } from "~/utils";

export default function SalesPage() {
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Invoices</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex h-full bg-white">
        <div className="flex flex-col font-bold text-gray-800">
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
            <button type="submit" className="flex gap-1 font-bold">
              Logout
            </button>
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
          isActive ? "rounded-md bg-gray-100" : ""
        }`
      }
    >
      {children}
    </NavLink>
  );
}
