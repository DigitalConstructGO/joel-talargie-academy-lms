# Dashboard financial metrics

Financial sections require `dashboard.read_financial`. They are omitted from overview and KPI responses without this permission. PostgreSQL numeric aggregates return decimal strings; currencies are never combined.
