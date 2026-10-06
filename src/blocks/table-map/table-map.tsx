import React from "react";
import { Restaurant } from "../../domain/booking";
export default function TableMap({
  restaurant,
  free,
  selected,
  onChange,
}: {
  restaurant: Restaurant;
  free: number[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  return (
    <section className="table-map">
      <h3>Выберите столики</h3>
      <p className="hint">
        Можно выбрать несколько. Число мест указано на каждом столике.
      </p>
      <div className="table-map__grid" aria-label="Схема столиков">
        {restaurant.capacities.map((capacity, i) => {
          const id = i + 1;
          return (
            <button
              type="button"
              key={id}
              disabled={!free.includes(id)}
              aria-pressed={selected.includes(id)}
              className={
                "button table-map__table" +
                (selected.includes(id) ? " table-map__table_selected" : "")
              }
              onClick={() =>
                onChange(
                  selected.includes(id)
                    ? selected.filter((x) => x !== id)
                    : [...selected, id],
                )
              }
            >
              № {id}
              <strong className="table-map__capacity">{capacity} мест</strong>
              <small className="table-map__state">
                {!free.includes(id)
                  ? "Занят"
                  : selected.includes(id)
                    ? "Выбран"
                    : "Свободен"}
              </small>
            </button>
          );
        })}
      </div>
      <p className="hint">
        Условная схема демонстрационного зала, не план реального ресторана.
      </p>
    </section>
  );
}
