# Dashboard permissions

`dashboard.read` grants normal dashboard access. Financial fields need `dashboard.read_financial`; full emails need `dashboard.read_sensitive`; recent administrator activity needs `dashboard.read_administrator_activity`; operational health needs `dashboard.read_operational_health`. Unauthorized sections are omitted rather than replaced with zeroes.
