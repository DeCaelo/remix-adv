export const inputClasses =
  "text-lg w-full rounded border border-theme-500 px-2 py-1";

export function InvoiceDetailsFallback() {
  return (
    <div>
      <div className="flex h-[56px] items-center border-t border-theme-100">
        <div className="h-[14px] w-full animate-pulse rounded bg-theme-300">
          &nbsp;
        </div>
      </div>
      <div className="flex h-[56px] items-center border-t border-theme-100">
        <div className="h-[14px] w-full animate-pulse rounded bg-theme-300">
          &nbsp;
        </div>
      </div>
    </div>
  );
}
