// TypeScript / React. Фон: флаг Грузии + винный градиент + виньетка.
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.28]"
        style={{ backgroundImage: "url(/bg.jpg)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(6,2,3,0.94)_35%,rgba(10,3,5,0.72)_75%,rgba(14,4,7,0.55)),linear-gradient(to_bottom,rgba(8,2,4,0.7),rgba(12,3,6,0.88))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(140,15,35,0.32),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(180,120,20,0.12),transparent_50%)]" />
    </div>
  );
}
