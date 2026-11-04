# tvbok_vouchers

Base de vouchers do **TV BOK**. O app lê o `vouchers.json` deste repositório para liberar as listas.

- `vouchers.json` guarda apenas o SHA-256 de cada voucher, nunca o código.
- `listas` contém os endereços das listas liberadas pelo voucher.

## Gerar vouchers

```bash
node gerar-voucher.mjs --qtd 3 --dias 30 --nota "Cliente"
node gerar-voucher.mjs --desativar TVBK-XXXX-XXXX-XXXX
```

Depois faça commit e push do `vouchers.json`.
