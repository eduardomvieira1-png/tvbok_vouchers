# tvbok_vouchers

Base de vouchers do **TV BOK**. O app lê o `vouchers.json` deste repositório para liberar as listas.

- `vouchers.json` guarda apenas o hash de cada voucher (PBKDF2 nos códigos de 8 caracteres, SHA-256 nos antigos), nunca o código.
- O repositório precisa ser **público**: o app baixa o arquivo sem login em `https://raw.githubusercontent.com/eduardomvieira1-png/tvbok_vouchers/main/vouchers.json`.
- `listas` contém os endereços das listas liberadas pelo voucher.

## Gerar vouchers

```bash
node gerar-voucher.mjs --qtd 3 --dias 30 --nota "Cliente"
node gerar-voucher.mjs --desativar K7QM-4HXP
```

Depois faça commit e push do `vouchers.json`.
