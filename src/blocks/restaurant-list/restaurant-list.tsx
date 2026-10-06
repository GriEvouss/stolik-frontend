import React, { useEffect, useState } from "react";
import {
  Booking,
  restaurants,
  defaultVisit,
  visitError,
  freeTables,
  seats,
  repository,
} from "../../domain/booking";
import VisitFields from "../visit-fields/visit-fields";
import RestaurantCard from "../restaurant-card/restaurant-card";
export default function RestaurantList() {
  const [v, setV] = useState(defaultVisit),
    [sort, setSort] = useState("waiting"),
    [bs, setBs] = useState<Booking[]>([]),
    [error, setError] = useState("");
  function reload() {
    try {
      setBs(repository().all());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, []);
  const invalid = visitError(v);
  const items = restaurants
    .map((r) => ({ r, free: seats(r, freeTables(r, v, bs)) }))
    .filter((x) => x.free >= v.guests)
    .sort((a, b) =>
      sort === "check"
        ? a.r.averageCheck - b.r.averageCheck || a.r.waiting - b.r.waiting
        : a.r.waiting - b.r.waiting || a.r.averageCheck - b.r.averageCheck,
    );
  return (
    <section className="restaurant-list">
      <section className="restaurant-list__search">
        <VisitFields value={v} onChange={setV} />
        <label className="field">
          Сначала
          <select
            className="field__control"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="waiting">Меньше ждать</option>
            <option value="check">Ниже средний чек</option>
          </select>
        </label>
      </section>
      {invalid || error ? (
        <p role="alert" className="notice notice_error">
          {invalid || error}
        </p>
      ) : (
        <>
          <div className="restaurant-list__heading">
            <h2 className="restaurant-list__title">Подходящие рестораны</h2>
            <span className="restaurant-list__count">
              {items.length} из {restaurants.length} · посещение на 2 часа
            </span>
          </div>
          {items.length ? (
            <div className="restaurant-list__grid">
              {items.map((x) => (
                <RestaurantCard
                  key={x.r.id}
                  restaurant={x.r}
                  visit={v}
                  available={x.free}
                  onClose={reload}
                />
              ))}
            </div>
          ) : (
            <section className="notice notice_empty">
              <h2>На это время нет подходящих мест</h2>
              <p>Попробуйте другую дату, время или меньшее число гостей.</p>
            </section>
          )}
        </>
      )}
    </section>
  );
}
