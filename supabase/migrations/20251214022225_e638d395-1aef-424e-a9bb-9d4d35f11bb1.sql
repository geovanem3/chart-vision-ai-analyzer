-- Remover policy permissiva redundante na tabela profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;