export default function DevBanner() {
  const isDev = import.meta.env.VITE_DEV_MODE === 'true';
  
  if (!isDev) return null;

  return (
    <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-medium">
      ✅ USANDO DADOS REAIS DO BANCO SUPABASE | 
      👤 Login: frpdias@icloud.com / 123456 | 
      📚 Questões autênticas do ENEM
    </div>
  );
}