import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Restaurant, Visit } from "../../domain/booking";
import Modal from "../modal/modal";
import BookingForm from "../booking-form/booking-form";
export default function RestaurantCard({
  restaurant: r,
  visit,
  available,
  onClose,
}: {
  restaurant: Restaurant;
  visit: Visit;
  available: number;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="restaurant-card">
      <div
        className={"restaurant-card__art restaurant-card__art_theme_" + r.id}
        aria-hidden="true"
      >
        <span className="restaurant-card__initial">
          {["", "К", "М", "М / С"][r.id]}
        </span>
        <small className="restaurant-card__badge">РЕСТОРАН • ДЕМО</small>
      </div>
      <div className="restaurant-card__body">
        <p className="eyebrow">{r.cuisine}</p>
        <h2 className="restaurant-card__title">
          <Link className="restaurant-card__link" to={"/restaurant/" + r.id}>
            {r.name}
          </Link>
        </h2>
        <div className="metrics">
          <span className="metrics__item">
            <strong className="metrics__value">
              {r.averageCheck.toLocaleString("ru-RU")} ₽
            </strong>
            средний чек
          </span>
          <span className="metrics__item">
            <strong className="metrics__value">{r.waiting} мин</strong>ожидание
            блюда
          </span>
        </div>
        <p className="restaurant-card__availability">
          {available} свободных мест на выбранное время
        </p>
        <button
          className="button restaurant-card__action"
          onClick={() => setOpen(true)}
        >
          Выбрать столик <span aria-hidden="true">→</span>
        </button>
        <Link className="restaurant-card__details" to={"/restaurant/" + r.id}>
          О ресторане
        </Link>
      </div>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      >
        <BookingForm restaurant={r} initial={visit} />
      </Modal>
    </article>
  );
}
