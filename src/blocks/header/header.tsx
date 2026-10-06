import React from "react";
import { NavLink, Link } from "react-router-dom";
import ThemeToggle from "../theme-toggle/theme-toggle";
export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        СТОЛИК<span className="header__tagline">ресторанные встречи</span>
      </Link>
      <div className="header__actions">
        <nav className="header__nav" aria-label="Основная навигация">
          <NavLink
            className={({ isActive }) =>
              "header__link" + (isActive ? " header__link_active" : "")
            }
            to="/"
            end
          >
            Рестораны
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              "header__link" + (isActive ? " header__link_active" : "")
            }
            to="/bookings"
          >
            Мои бронирования
          </NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
