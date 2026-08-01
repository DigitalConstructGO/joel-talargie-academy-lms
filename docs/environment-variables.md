# Environment variables

The API validates `NODE_ENV`, `API_PORT`, `WEB_URL`, and `BCRYPT_SALT_ROUNDS` with Zod at startup. Salt rounds must be an integer from 10 through 14. The browser reads only `NEXT_PUBLIC_API_URL`. Never commit `.env` files, JWT secrets, SMTP credentials, or storage keys.
