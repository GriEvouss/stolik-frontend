export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  description: string;
  averageCheck: number;
  waiting: number;
  capacities: number[];
}
export interface Visit {
  date: string;
  time: string;
  guests: number;
}
export interface Booking extends Visit {
  id: string;
  restaurantId: number;
  tableIds: number[];
  name: string;
  phone: string;
  comments: string;
  status: "active" | "cancelled";
}
export const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "Каравелла",
    cuisine: "Европейская кухня",
    description:
      "Спокойный зал для встреч и семейного ужина. Десять столиков; небольшие компании могут выбрать отдельный стол, большие — несколько.",
    averageCheck: 2000,
    waiting: 30,
    capacities: [4, 4, 4, 4, 4, 4, 3, 3, 2, 2],
  },
  {
    id: 2,
    name: "Молодость",
    cuisine: "Городское кафе",
    description:
      "Небольшой зал с тремя столиками. Подходит для обеда и встреч в тесном кругу.",
    averageCheck: 1000,
    waiting: 15,
    capacities: [3, 3, 3],
  },
  {
    id: 3,
    name: "Мясо и Салат",
    cuisine: "Гриль и овощи",
    description:
      "Шесть столиков, включая два больших на восемь гостей. Можно выбрать несколько столиков для одной компании.",
    averageCheck: 1500,
    waiting: 60,
    capacities: [8, 8, 3, 3, 3, 3],
  },
];
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function defaultVisit(): Visit {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: localDate(d), time: "18:00", guests: 2 };
}
export function visitError(v: Visit, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.time))
    return "Укажите дату и время посещения.";
  const start = new Date(`${v.date}T${v.time}:00`);
  if (!Number.isFinite(start.getTime()) || localDate(start) !== v.date)
    return "Укажите существующую дату.";
  const [h, m] = v.time.split(":").map(Number);
  if (m > 59 || h < 9 || h > 21 || (h === 21 && m !== 0))
    return "Начало бронирования — с 09:00 до 21:00. Время посещения — 2 часа.";
  if (start <= now) return "Дата и время посещения должны быть в будущем.";
  if (!Number.isInteger(v.guests) || v.guests < 1 || v.guests > 34)
    return "Укажите целое число гостей от 1 до 34.";
  return null;
}
export function overlaps(a: Visit, b: Visit): boolean {
  const x = new Date(`${a.date}T${a.time}`).getTime(),
    y = new Date(`${b.date}T${b.time}`).getTime();
  return x < y + 7200000 && y < x + 7200000;
}
export function freeTables(r: Restaurant, v: Visit, bs: Booking[]): number[] {
  return r.capacities
    .map((_, i) => i + 1)
    .filter(
      (id) =>
        !bs.some(
          (b) =>
            b.status === "active" &&
            b.restaurantId === r.id &&
            b.tableIds.includes(id) &&
            overlaps(b, v),
        ),
    );
}
export function seats(r: Restaurant, ids: number[]): number {
  return ids.reduce((n, id) => n + (r.capacities[id - 1] || 0), 0);
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const KEY = "restaurant-coursework.bookings.v1";
// Repository encapsulates persistence; injected storage enables isolated unit tests.
export class BookingRepository {
  constructor(private storage: StoragePort) {}
  all(): Booking[] {
    let raw: string | null;
    try {
      raw = this.storage.getItem(KEY);
    } catch {
      throw new Error(
        "Хранилище браузера недоступно. Разрешите сохранение данных.",
      );
    }
    if (raw === null) return [];
    try {
      const data: unknown = JSON.parse(raw);
      if (
        !Array.isArray(data) ||
        !data.every(
          (b: any) =>
            b &&
            typeof b.id === "string" &&
            restaurants.some((r) => r.id === b.restaurantId) &&
            Array.isArray(b.tableIds) &&
            b.tableIds.length > 0 &&
            b.tableIds.every(
              (id: unknown) =>
                Number.isInteger(id) &&
                Number(id) > 0 &&
                Number(id) <=
                  restaurants.find((r) => r.id === b.restaurantId)!.capacities
                    .length,
            ) &&
            typeof b.date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
            typeof b.time === "string" &&
            /^\d{2}:\d{2}$/.test(b.time) &&
            Number.isFinite(new Date(`${b.date}T${b.time}`).getTime()) &&
            Number.isInteger(b.guests) &&
            b.guests > 0 &&
            typeof b.name === "string" &&
            typeof b.phone === "string" &&
            typeof b.comments === "string" &&
            ["active", "cancelled"].includes(b.status),
        )
      )
        throw new Error();
      return data as Booking[];
    } catch {
      throw new Error(
        "Сохранённые данные повреждены. Автоматическая перезапись отключена. Очистите данные этого сайта в настройках браузера, если они больше не нужны.",
      );
    }
  }
  private save(bs: Booking[]) {
    try {
      this.storage.setItem(KEY, JSON.stringify(bs));
    } catch {
      throw new Error(
        "Не удалось сохранить бронь: хранилище недоступно или заполнено.",
      );
    }
  }
  create(input: Omit<Booking, "id" | "status">): Booking {
    const err = visitError(input);
    if (err) throw new Error(err);
    if (!/^[а-яёa-z][а-яёa-z\s-]{1,59}$/i.test(input.name.trim()))
      throw new Error(
        "Введите имя от 2 до 60 символов, используя буквы, пробелы и дефис.",
      );
    if (!/^(\+7|8)\d{10}$/.test(input.phone.replace(/[\s()-]/g, "")))
      throw new Error(
        "Введите российский телефон: +7 и 10 цифр или 8 и 10 цифр.",
      );
    if (input.comments.length > 500)
      throw new Error("Комментарий должен быть не длиннее 500 символов.");
    const r = restaurants.find((r) => r.id === input.restaurantId);
    if (!r) throw new Error("Ресторан не найден.");
    const all = this.all(),
      free = freeTables(r, input, all);
    if (
      !input.tableIds.length ||
      new Set(input.tableIds).size !== input.tableIds.length ||
      !input.tableIds.every((id) => free.includes(id))
    )
      throw new Error(
        "Выбранные столики уже заняты или недоступны. Выберите другие.",
      );
    if (seats(r, input.tableIds) < input.guests)
      throw new Error("За выбранными столиками недостаточно мест.");
    const b: Booking = {
      ...input,
      name: input.name.trim(),
      phone: input.phone.replace(/[\s()-]/g, ""),
      id: crypto.randomUUID(),
      status: "active",
    };
    this.save([...all, b]);
    return b;
  }
  cancel(id: string): void {
    const all = this.all();
    if (!all.some((b) => b.id === id)) throw new Error("Бронь не найдена.");
    this.save(
      all.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
  }
}
export function repository() {
  try {
    return new BookingRepository(window.localStorage);
  } catch {
    throw new Error("Хранилище браузера недоступно.");
  }
}
