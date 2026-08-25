import { comparisonRows } from "@/config/estimator.config";
import { IconCheck, IconClose } from "@/components/estimator/icons";

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="font-semibold text-[var(--ge-dark-gray)]">{value}</span>;
  }
  return value ? (
    <span className="text-[var(--ge-green)]" aria-label="Included">
      <IconCheck />
    </span>
  ) : (
    <span className="text-[var(--ge-supporting-gray)]" aria-label="Not included">
      <IconClose />
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section aria-labelledby="comparison-heading" className="mt-16">
      <h2 id="comparison-heading" className="font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)]">
        Compare the Garage FX® systems
      </h2>

      {/* Table for sm+ screens */}
      <div className="mt-6 hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--ge-light-gray)]">
              <th scope="col" className="py-3 pr-4 font-semibold text-[var(--ge-dark-gray)]">
                Feature
              </th>
              <th scope="col" className="px-4 py-3 text-center font-semibold text-[var(--ge-dark-gray)]">
                Silver
              </th>
              <th scope="col" className="px-4 py-3 text-center font-semibold text-[var(--ge-dark-gray)]">
                Gold
              </th>
              <th scope="col" className="px-4 py-3 text-center font-semibold text-[var(--ge-dark-gray)]">
                Platinum
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label} className="border-b border-[var(--ge-light-gray)]">
                <th scope="row" className="py-3 pr-4 font-normal text-[var(--ge-dark-gray)]">
                  {row.label}
                </th>
                <td className="px-4 py-3 text-center">
                  <Cell value={row.silver} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Cell value={row.gold} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Cell value={row.platinum} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked groups for small screens */}
      <div className="mt-6 space-y-6 sm:hidden">
        {(["silver", "gold", "platinum"] as const).map((plan) => (
          <div key={plan} className="rounded-2xl border-2 border-[var(--ge-light-gray)] p-4">
            <h3 className="font-[var(--font-heading)] text-lg font-bold capitalize text-[var(--ge-dark-gray)]">
              {plan}
            </h3>
            <ul className="mt-3 space-y-2">
              {comparisonRows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[var(--ge-dark-gray)]">{row.label}</span>
                  <Cell value={row[plan]} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
