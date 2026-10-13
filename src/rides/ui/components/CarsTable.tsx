import { formatDate } from "../../../common/domain/services/DateFormatService";
import { RowMenu } from "../../../common/ui/components/RowMenu";
import { driverName, type Car } from "../../domain/models/Car";
import { carsCopy } from "../assets/copy";

export type CarRowAction = "edit" | "drivers" | "remove";

const ROW_ACTIONS: readonly CarRowAction[] = ["edit", "drivers", "remove"];

interface CarsTableProps {
  cars: readonly Car[];
  busy: boolean;
  onAction: (car: Car, action: CarRowAction) => void;
}

export function CarsTable({ cars, busy, onAction }: CarsTableProps) {
  return (
    <div className="table-wrap" aria-busy={busy}>
      <table className="data-table">
        <caption className="sr-only">{carsCopy.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{carsCopy.columns.plate}</th>
            <th scope="col">{carsCopy.columns.driver}</th>
            <th scope="col">{carsCopy.columns.vin}</th>
            <th scope="col">{carsCopy.columns.servicedAt}</th>
            <th scope="col" className="actions-col">
              <span className="sr-only">{carsCopy.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <th scope="row" className="plate-cell">
                {car.plate}
              </th>
              <td>
                {car.drivers.length === 0 ? (
                  <span className="muted">{carsCopy.noDriver}</span>
                ) : (
                  <ul className="driver-names">
                    {car.drivers.map((driver) => (
                      <li key={driver.id}>{driverName(driver)}</li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="vin-cell">{car.vin ?? carsCopy.noValue}</td>
              <td className="date-cell">
                {car.servicedAt
                  ? formatDate(car.servicedAt) || carsCopy.noValue
                  : carsCopy.noValue}
              </td>
              <td className="actions-col">
                <RowMenu
                  triggerLabel={carsCopy.actionsFor(car.plate)}
                  items={ROW_ACTIONS.map((action) => ({
                    action,
                    label: carsCopy.menu[action],
                    tone: action === "remove" ? "danger" : undefined,
                  }))}
                  onSelect={(action) => onAction(car, action)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
