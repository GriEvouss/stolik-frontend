import React from "react";
import RestaurantList from "../restaurant-list/restaurant-list";
export default function HomePage() {
  return (
    <section className="home-page">
      <section className="hero">
        <p className="eyebrow">Хорошие встречи начинаются здесь</p>
        <h1 className="hero__title">
          Ваш вечер.
          <br />
          <em className="hero__accent">Ваш столик.</em>
        </h1>
        <p className="hero__description">
          Выберите время, соберите близких —<br />
          мы поможем найти место для вашей компании.
        </p>
      </section>
      <RestaurantList />
    </section>
  );
}
