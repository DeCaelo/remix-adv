import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUser } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return json({});
}

export default function DashboardRoute() {
  return <div>Look at all these graphs!</div>;
}
