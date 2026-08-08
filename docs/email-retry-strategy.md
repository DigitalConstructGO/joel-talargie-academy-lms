# Email retry strategy

Temporary failures use bounded exponential delays. Permanent failures and exhausted attempts become terminal. Processing locks older than the configured timeout are recovered.
