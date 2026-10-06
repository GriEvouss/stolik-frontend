import React from "react";
import { Link, useParams } from "react-router-dom";
import { restaurants } from "../../domain/booking";
import BookingForm from "../booking-form/booking-form";
export default function RestaurantPage() {
  const { id } = useParams();
  const r = restaurants.find((r) => String(r.id) === id);
  if (!r)
    return (
      <section className="notice notice_empty">
        <h1>Ресторан не найден</h1>
        <Link to="/">Вернуться к ресторанам</Link>
      </section>
    );
  return (
    <section className="restaurant-page">
      <Link to="/">← Все рестораны</Link>
      <section className="page-intro">
        <p className="eyebrow">{r.cuisine} · демонстрационный ресторан</p>
        <h1 className="page-intro__title">{r.name}</h1>
        <p>{r.description}</p>
        <p>
          Средний чек {r.averageCheck} ₽ · ожидание {r.waiting} минут ·{" "}
          {r.capacities.length} столиков
        </p>
      </section>
      <BookingForm key={r.id} restaurant={r} />
    </section>
  );
}
