import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Restaurant,
  Visit,
  Booking,
  defaultVisit,
  visitError,
  freeTables,
  seats,
  repository,
} from "../../domain/booking";
import VisitFields from "../visit-fields/visit-fields";
import TableMap from "../table-map/table-map";
export default function BookingForm({
  restaurant,
  initial = defaultVisit(),
}: {
  restaurant: Restaurant;
  initial?: Visit;
}) {
  const [visit, setVisit] = useState(initial),
    [selected, setSelected] = useState<number[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]),
    [error, setError] = useState(""),
    [storageError, setStorageError] = useState(""),
    [success, setSuccess] = useState<Booking | null>(null),
    [busy, setBusy] = useState(false);
  function reload() {
    try {
      setBookings(repository().all());
      setStorageError("");
    } catch (e) {
      setStorageError((e as Error).message);
    }
  }
  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, []);
  const invalid = visitError(visit),
    free = invalid ? [] : freeTables(restaurant, visit, bookings);
  const changeVisit = (v: Visit) => {
    setVisit(v);
    setSelected([]);
    setError("");
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const b = repository().create({
        ...visit,
        restaurantId: restaurant.id,
        tableIds: selected,
        name: String(data.get("name") || ""),
        phone: String(data.get("phone") || ""),
        comments: String(data.get("comments") || ""),
      });
      setSuccess(b);
    } catch (e) {
      setError((e as Error).message);
      reload();
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <section role="status" className="notice notice_success">
        <p className="eyebrow">Демонстрационная бронь сохранена</p>
        <h2>До встречи за столиком</h2>
        <p className="notice__text">
          {restaurant.name} · {success.date.split("-").reverse().join(".")} ·{" "}
          {success.time}
        </p>
        <p className="notice__text">
          {success.guests} гостей · столики {success.tableIds.join(", ")} · 2
          часа
        </p>
        <p className="notice__text">
          Запись хранится только в этом браузере. Ресторан не получал заявку.
        </p>
        <Link className="button" to="/bookings">
          Мои бронирования
        </Link>
      </section>
    );
  return (
    <form onSubmit={submit} className="booking-form">
      <h2 className="booking-form__title">
        Бронирование в «{restaurant.name}»
      </h2>
      <p className="booking-form__description">
        Ежедневно с 09:00 до 23:00. Бронь на 2 часа, последнее начало — 21:00.
        Время местное, по часам устройства.
      </p>
      <ol className="booking-form__steps" aria-label="Этапы бронирования">
        <li className="booking-form__step">1. Время и гости</li>
        <li
          className="booking-form__step"
          aria-current={
            seats(restaurant, selected) < visit.guests ? "step" : undefined
          }
        >
          2. Выбор столиков
        </li>
        <li
          className="booking-form__step"
          aria-current={
            seats(restaurant, selected) >= visit.guests ? "step" : undefined
          }
        >
          3. Данные и сохранение
        </li>
      </ol>
      <VisitFields value={visit} onChange={changeVisit} />
      {invalid && (
        <p role="alert" className="notice notice_error">
          {invalid}
        </p>
      )}
      {storageError && (
        <p role="alert" className="notice notice_error">
          {storageError}
        </p>
      )}
      <div className="booking-form__columns">
        <TableMap
          restaurant={restaurant}
          free={free}
          selected={selected}
          onChange={setSelected}
        />
        <section>
          <h3>Данные гостя</h3>
          <label className="field">
            Ваше имя
            <input
              className="field__control"
              name="name"
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={60}
            />
          </label>
          <label className="field">
            Телефон
            <input
              className="field__control"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+7 900 000-00-00"
            />
          </label>
          <label className="field">
            Комментарий <span className="hint">(необязательно)</span>
            <textarea
              className="field__control field__control_multiline"
              name="comments"
              maxLength={500}
              rows={3}
            />
          </label>
          <p
            className="notice__text"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Выбрано мест: <strong>{seats(restaurant, selected)}</strong> /{" "}
            {visit.guests}
          </p>
          <p className="hint">
            Для проверки используйте вымышленные контактные данные. Они
            сохраняются локально вместе с бронью.
          </p>
          {error && (
            <p className="notice notice_error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button"
            type="submit"
            disabled={
              busy ||
              !!invalid ||
              !!storageError ||
              seats(restaurant, selected) < visit.guests
            }
          >
            {busy ? "Сохранение…" : "Сохранить демобронь"}
          </button>
        </section>
      </div>
    </form>
  );
}
