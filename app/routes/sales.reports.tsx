import { Form } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { requireUser } from "~/session.server";
import { inputClasses } from "~/styles";
import { Button } from "~/components/ui/button";

// TODO:
// type LoaderData = {
//   invoiceReport: {
//     count: number;
//     paidAmount: number;
//     dueAmount: number;
//     overdueAmount: number;
//   };
//   customerReport: {
//     count: number;
//     mostInvoiced: {
//       id: string;
//       name: string;
//       count: number;
//     };
//     leastInvoiced: {
//       id: string;
//       name: string;
//       count: number;
//     };
//     highestInvoiced: {
//       id: string;
//       name: string;
//       amount: number;
//     };
//     lowestInvoiced: {
//       id: string;
//       name: string;
//       amount: number;
//     };
//   };
// };

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  // TODO: make this thing work
  // const searchParams = new URL(request.url).searchParams;
  // const startDate = parseDate(searchParams.get("startDate") || "1000-01-01");
  // const endDate = parseDate(searchParams.get("endDate") || "1000-01-01");
  return json({});
}

export default function ReportsRoute() {
  return (
    <div className="relative h-full p-10">
      <h1 className="font-display text-d-h3 text-black">Reports</h1>
      <div className="h-6" />
      <div className="flex gap-4 border-b border-gray-100 pb-4 text-[length:14px] font-medium">
        <Form className="margin-auto flex justify-center gap-4">
          <div>
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              className={inputClasses}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" size={"lg"}>
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
