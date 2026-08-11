# Revenue calculation

Revenue counts only approved manual payments and sums the submitted payment snapshot amount in PostgreSQL. Pending and declined payments are excluded. Currency totals never merge, and numeric values remain decimal strings across the API and exports.
