import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Booking, restaurants, repository } from "../../domain/booking";
export default function BookingsPage() {
  const [bs, setBs] = useState<Booking[]>([]),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all"),
    [pending, setPending] = useState(""),
    [message, setMessage] = useState("");
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
  function cancel(id: string) {
    try {
      repository().cancel(id);
      setPending("");
      setMessage("Бронирование отменено. Столики снова доступны.");
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const ended = (b: Booking) =>
    new Date(`${b.date}T${b.time}`).getTime() + 7200000 <= Date.now();
  const shown = bs
    .filter(
      (b) =>
        filter === "all" ||
        (filter === "active" && b.status === "active" && !ended(b)) ||
        (filter === "cancelled" && b.status === "cancelled"),
    )
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return (
    <section className="bookings-page">
      <section className="page-intro">
        <p className="eyebrow">Ваши планы</p>
        <h1 className="page-intro__title">Мои бронирования</h1>
        <p>
          Демонстрационные записи этого браузера. Вход в аккаунт не требуется.
        </p>
      </section>
      <label className="field bookings-page__filter">
        Показать
        <select
          className="field__control"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Все бронирования</option>
          <option value="active">Предстоящие и текущие</option>
          <option value="cancelled">Отменённые</option>
        </select>
      </label>
      {error && (
        <p className="notice notice_error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!error && !shown.length && (
        <section className="notice notice_empty">
          <h2>Здесь пока нет бронирований</h2>
          <Link className="button" to="/">
            Найти ресторан
          </Link>
        </section>
      )}
      <div className="bookings-page__list">
        {shown.map((b) => (
          <article className="booking-card" key={b.id}>
            <div>
              <p className="eyebrow">
                {b.status === "cancelled"
                  ? "Отменено"
                  : ended(b)
                    ? "Завершено"
                    : "Активно"}
              </p>
              <h2 className="booking-card__title">
                {restaurants.find((r) => r.id === b.restaurantId)?.name}
              </h2>
              <p className="booking-card__text">
                {b.date.split("-").reverse().join(".")} · {b.time} · 2 часа
              </p>
              <p className="booking-card__text">
                {b.guests} гостей · столики {b.tableIds.join(", ")}
              </p>
              <p className="booking-card__text">
                {b.name} · {b.phone}
              </p>
              {b.comments && <p className="booking-card__text">{b.comments}</p>}
              <small className="hint">Код: {b.id.slice(0, 8)}</small>
            </div>
            {b.status === "active" &&
              !ended(b) &&
              (pending === b.id ? (
                <div>
                  <p className="booking-card__text">Отменить эту демобронь?</p>
                  <button className="button" onClick={() => cancel(b.id)}>
                    Да, отменить
                  </button>
                  <button
                    className="button button_secondary"
                    onClick={() => setPending("")}
                  >
                    Оставить
                  </button>
                </div>
              ) : (
                <button
                  className="button button_secondary"
                  onClick={() => setPending(b.id)}
                >
                  Отменить бронь
                </button>
              ))}
          </article>
        ))}
      </div>
    </section>
  );
}
