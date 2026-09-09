import { LIVE_ORDERS, money, usd } from '../data';
import { PayMark } from '../icons';

const label = (method: string) => (method === 'CARD' ? 'Card' : method);

export function LiveOrders() {
  return (
    <section className="card orders" aria-labelledby="orders-title">
      <header className="orders__head">
        <h2 className="orders__title" id="orders-title">
          Live Orders
        </h2>
        <p className="orders__sub">Recent purchases by other buyers</p>
      </header>

      <div className="orders__scroll">
        <table className="orders__table">
          <thead>
            <tr>
              <th scope="col">Paid With</th>
              <th scope="col">Order</th>
              <th scope="col">$RTX Amount</th>
              <th scope="col">USD Value</th>
              <th scope="col" className="is-right">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {LIVE_ORDERS.map((order) => (
              <tr key={order.id}>
                <td>
                  <span className="orders__method">
                    <PayMark id={order.method} className="icon-22" />
                    {label(order.method)}
                  </span>
                </td>
                <td className="orders__id">#{order.id}</td>
                <td>{money(order.rtx)}</td>
                <td>{usd(order.usd)}</td>
                <td className="is-right orders__time">{order.minutesAgo}m ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
