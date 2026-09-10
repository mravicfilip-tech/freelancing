import { money, usd, type Order } from '../data';
import { EmptyState, OrdersArt } from '../EmptyState';
import { PayMark } from '../icons';

const label = (method: string) => (method === 'CARD' ? 'Card' : method);

export function LiveOrders({ orders }: { orders: Order[] }) {
  return (
    <section className="card orders" aria-labelledby="orders-title">
      <header>
        <h2 className="card__title" id="orders-title">
          Live orders
        </h2>
        <p className="orders__sub">What other buyers just bought</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          art={OrdersArt}
          title="No orders yet"
          body="This stage has only just opened. Every purchase across the presale shows up here within a few seconds of clearing."
        />
      ) : (
      <div className="orders__scroll">
        <table className="orders__table">
          <thead>
            <tr>
              <th scope="col">Paid with</th>
              <th scope="col">Order</th>
              <th scope="col">$RTX</th>
              <th scope="col">USD value</th>
              <th scope="col" className="is-right">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span className="orders__method">
                    <PayMark id={order.method} className="icon-22" />
                    {label(order.method)}
                  </span>
                </td>
                <td className="num orders__id">#{order.id}</td>
                <td className="num orders__rtx">{money(order.rtx)}</td>
                <td className="num orders__usd">{usd(order.usd)}</td>
                <td className="num is-right orders__time">{order.minutesAgo}m ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
