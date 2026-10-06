import React from "react";
import { Visit, localDate } from "../../domain/booking";
export default function VisitFields({
  value,
  onChange,
}: {
  value: Visit;
  onChange: (v: Visit) => void;
}) {
  return (
    <div className="visit-fields">
      <label className="field">
        Дата
        <input
          className="field__control"
          type="date"
          required
          min={localDate()}
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
      </label>
      <label className="field">
        Время
        <input
          className="field__control"
          type="time"
          required
          min="09:00"
          max="21:00"
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
        />
      </label>
      <label className="field visit-fields__guests">
        Гостей
        <input
          className="field__control"
          type="number"
          required
          min="1"
          max="34"
          step="1"
          value={value.guests}
          onChange={(e) =>
            onChange({ ...value, guests: Number(e.target.value) })
          }
        />
      </label>
    </div>
  );
}
