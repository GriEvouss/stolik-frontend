import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./blocks/header/header";
import HomePage from "./blocks/home-page/home-page";
import RestaurantPage from "./blocks/restaurant-page/restaurant-page";
import BookingsPage from "./blocks/bookings-page/bookings-page";
import "./styles/index.css";
export default function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Header />
      <div className="demo-banner">
        Демонстрационный режим · вымышленные рестораны · брони сохраняются в
        этом браузере и не отправляются ресторану
      </div>
      <main className="page-layout" id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route
            path="*"
            element={
              <section className="notice notice_empty">
                <h1>Страница не найдена</h1>
                <Link to="/">Вернуться на главную</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        СТОЛИК · Учебное приложение для бронирования столиков
        <br />
        Демонстрационные данные. Часы работы: 09:00–23:00.
      </footer>
    </BrowserRouter>
  );
}
