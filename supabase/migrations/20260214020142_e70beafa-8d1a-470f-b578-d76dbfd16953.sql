
-- 1. Adicionar política DELETE para analysis_cache (usuários podem limpar seu próprio cache)
CREATE POLICY "Users can delete their own cache"
ON public.analysis_cache
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Adicionar política DELETE para profiles (usuários podem deletar seu próprio perfil)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);
