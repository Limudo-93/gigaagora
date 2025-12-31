-- Add CPF column to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'cpf'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cpf text;
  END IF;
END $$;
