-- Stable NIM values for the existing local demo accounts.
update public.profiles as profiles
set nim = demo.nim
from (
  values
    ('admin@mycash.demo', '000000000001'),
    ('demo@mycash.demo', '221011400123'),
    ('suspended@mycash.demo', '221011400124')
) as demo(email, nim)
where lower(profiles.email) = demo.email
  and profiles.nim is null;

