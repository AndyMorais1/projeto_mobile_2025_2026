export default function CancelPage() {
  return (
    <div className="mx-auto max-w-xl p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Pagamento cancelado</h1>
      <p className="text-sm text-muted-foreground">
        O pagamento foi cancelado. Pode tentar novamente quando quiser.
      </p>
      <a className="underline" href="/dashboard">Voltar</a>
    </div>
  );
}
