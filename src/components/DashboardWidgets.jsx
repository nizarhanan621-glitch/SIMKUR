
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import "../styles/DashboardWidgets.css";

/* ==========================================
   KARTU STATISTIK SIMKUR
   ========================================== */

export function StatCard({
  title,
  value,
  icon: Icon,
  caption,
  color = "blue",
}) {
  return (
    <article className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">
          {Icon && <Icon size={21} strokeWidth={1.9} />}
        </div>

        <span className="stat-card-caption">
          {caption}
        </span>
      </div>

      <div className="stat-card-content">
        <span className="stat-card-title">
          {title}
        </span>

        <strong className="stat-card-value">
          {value}
        </strong>
      </div>
    </article>
  );
}

/* ==========================================
   GRAFIK LINGKARAN / DONUT SIMKUR
   ========================================== */

export function DonutChart({
  title,
  subtitle,
  data = [],
  centerValue,
  centerLabel = "Total",
}) {
  const total = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <section className="donut-card">

      <div className="donut-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <span className="donut-menu">•••</span>
      </div>

      <div className="donut-chart-area">

        {data.length > 0 && total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="88%"
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                >
                  {data.map((item, index) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={item.color || "#2878C8"}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #D9E2EC",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center">
              <strong>
                {centerValue ?? total}
              </strong>
              <span>{centerLabel}</span>
            </div>
          </>
        ) : (
          <div className="donut-empty">
            Belum ada data untuk ditampilkan
          </div>
        )}

      </div>

      <div className="donut-legend">
        {data.map((item, index) => (
          <div
            className="donut-legend-item"
            key={`${item.name}-${index}`}
          >
            <span
              className="donut-legend-dot"
              style={{
                backgroundColor: item.color || "#2878C8",
              }}
            />

            <span className="donut-legend-name">
              {item.name}
            </span>

            <strong className="donut-legend-value">
              {item.value}
            </strong>
          </div>
        ))}
      </div>

    </section>
  );
}
